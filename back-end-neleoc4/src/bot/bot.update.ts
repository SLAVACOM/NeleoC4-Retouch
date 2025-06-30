import { Logger } from '@nestjs/common';
import { GenerationType, LanguageEnum, Payment, User } from '@prisma/client';
import axios from 'axios';
import * as heicConvert from 'heic-convert';
import {
  Action,
  Command,
  Ctx,
  InjectBot,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import * as sharp from 'sharp';
import { DiscountService } from 'src/discount/discount.service';
import { ProductsService } from 'src/products/products.service';
import { PromoCodeService } from 'src/promocodes/promocode.service';
import { SupportService } from 'src/support/support.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserService } from 'src/users/user.service';
import { VialsService } from 'src/vials/vials/vials.service';
import { Context, Markup, session, Telegraf } from 'telegraf';
import {
  CallbackQuery,
  InlineKeyboardButton,
  InputMediaPhoto,
  Message,
} from 'telegraf/typings/core/types/typegram';
import * as urlencode from 'urlencode';
import { ApiSettingsService } from './../api/api-settings.service';
import { LocalizationService } from './../messages/localization.service';
import { RetouchService } from './../retouch/retouch.service';

@Update()
export class BotUpdate {
  private url = process.env.RETOUCH_API;
  private token = process.env.RETOUCH_API_TOKEN;
  private modes = [
    { key: 'mode_light', id: 1 },
    { key: 'mode_medium', id: 2 },
    { key: 'mode_hard', id: 3 },
  ];

  private promoCodeSet = new Set<BigInt>();
  private watermarkMessageId = new Map<number, string>();
  private vialSelectionMessageId = new Map<number, number>();
  private maxVialsSelected = new Map<number, number>();
  private paymentMessageId = new Map<number, number>();
  private progressMessageId = new Map<string, number>();

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly userService: UserService,
    private readonly retouchService: RetouchService,
    private readonly settingsService: ApiSettingsService,
    private readonly vialsService: VialsService,
    private readonly localizationService: LocalizationService,
    private readonly supportService: SupportService,
    private readonly promoCodeService: PromoCodeService,
    private readonly productService: ProductsService,
    private readonly discountService: DiscountService,
  ) {
    this.bot.use(session());
  }

  @Start()
  async startCommand(ctx: Context) {
    console.log('Start command received');

    if (ctx.from) {
      try {
        const userExists = await this.userService.userIsExistsByTelegramId(
          ctx.from.id,
        );

        if (userExists) {
          await this.sentLocalizedSupportMessage(ctx, 'welcome_back');
          console.log(
            `User ${ctx.from.id} exists. Sending welcome back message.`,
          );
          this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));
        } else {
          const userTg: CreateUserDto = {
            telegramId: BigInt(ctx.from.id),
            username: ctx.from.username || '',
            fullName:
              `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim(),
            language: ctx.from.language_code === 'ru' ? 'RU' : 'EN',
          };
          const newUser = await this.userService.create(userTg);

          await this.setUserCommands(ctx);

          const caption = await this.getLocalizedSupportMessage(
            newUser.language,
            'welcome',
            new Map([['name', userTg.fullName]]),
          );

          await this.sendVideo(ctx, './media/welcome.mp4', caption);
        }
      } catch (e) {
        console.log('Error in startCommand', e.message || e);
      }
    }
  }

  @On(['photo', 'document'])
  async getPhoto(@Ctx() ctx: Context) {
    if (ctx.from === undefined) return;
    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from?.id),
    );
    if (!user) {
      console.log(`User ${ctx.from.id} not found.`);
      return;
    }
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));
    console.log(`Received photo/document from user ${ctx.from.id}.`);

    if (user.paymentGenerationCount <= 0 && user.freeGenerationCount <= 0) {
      console.log(`User ${ctx.from.id} has no available generations.`);

      await this.sentLocalizedSupportMessage(ctx, 'generations_expired');
      return;
    }

    let fileLink, messageType;

    if ((ctx.message as Message.PhotoMessage).photo) {
      messageType = 'photo';
      const photo = (ctx.message as Message.PhotoMessage).photo;
      fileLink = await ctx.telegram.getFileLink(
        photo[photo.length - 1].file_id,
      );
      console.log(`Photo file link retrieved for user ${ctx.from.id}.`);
    } else if ((ctx.message as Message.DocumentMessage).document) {
      messageType = 'document';
      const document = (ctx.message as Message.DocumentMessage).document;
      fileLink = await ctx.telegram.getFileLink(document.file_id);
      console.log(`Document file link retrieved for user ${ctx.from.id}.`);
    }

    if (!fileLink || !this.url || !this.token) {
      console.log(`Missing file link, URL, or token for user ${ctx.from.id}.`);
      return;
    }

    if (this.watermarkMessageId.has(user.id)) {
      await this.sentLocalizedSupportMessage(ctx, 'watermark_upload_success');
      const retouchId = this.watermarkMessageId.get(user.id)!;
      this.watermarkMessageId.delete(user.id);

      try {
        const response = await axios.get(fileLink.href, {
          responseType: 'arraybuffer',
        });
        const watermarkBuffer = Buffer.from(response.data);

        await this.sendRetouchToUser(
          `${this.url}getFile/${retouchId}`,
          user,
          GenerationType.PAID,
          'photo',
          true,
          watermarkBuffer,
        );
      } catch (e) {
        console.error('Error while applying custom watermark:', e);
        await this.sentLocalizedSupportMessage(ctx, 'watermark_upload_failed');
      }
      return;
    }

    if (
      ctx.from?.id !== undefined &&
      this.url !== undefined &&
      this.token !== undefined &&
      fileLink
    ) {
      const user = await this.userService.getUserByTelegramId(
        BigInt(ctx.from.id),
      );
      let type: GenerationType;
      if (user.paymentGenerationCount > 0) type = GenerationType.PAID;
      else if (user.freeGenerationCount > 0) type = GenerationType.FREE;
      else {
        await this.sentLocalizedSupportMessage(ctx, 'no_generations');
        return;
      }

      try {
        const response = await axios.get(fileLink?.href, {
          responseType: 'arraybuffer',
        });

        let fileBuffer = Buffer.from(response.data);
        try {
          fileBuffer = await sharp(fileBuffer)
            .jpeg({ quality: 100 })
            .toBuffer();
        } catch (error: any) {
          if (error.message.includes('No decoding plugin')) {
            fileBuffer = await convertHeicToJpeg(fileBuffer);
          } else {
            console.error('Error while converting image:', error);
            await this.sentLocalizedSupportMessage(ctx, 'file_upload_error');
            return;
          }
        }

        const retouchId = await this.retouchService.sendPhotoToRetouch({
          file: fileBuffer,
          retouchURL: this.url,
          userId: user.id,
          token: this.token,
          settingsId:
            type === GenerationType.FREE
              ? await this.settingsService.getDefaultSettings()
              : await this.settingsService.getUserSettings(user.id),
          type,
        });

        const progressBar = await getProgressBar(0);
        const text = await this.getLocalizedSupportMessage(
          user.language,
          'photo_sent',
          new Map([['progress', progressBar]]),
        );
        const sendMessage = await ctx.reply(text);
        this.progressMessageId.set(retouchId, sendMessage.message_id);

        await this.updateGenerationStatus(retouchId, user);

        await ctx.deleteMessage(sendMessage.message_id);
        this.progressMessageId.delete(retouchId);

        await this.sentLocalizedSupportMessage(ctx, 'photo_processed');

        if (type === GenerationType.PAID)
          await this.sendVialSelection(ctx, user, retouchId);
        else {
          await this.sentLocalizedSupportMessage(ctx, 'u_need_add_balance');
          const url = `${this.url}getFile/${retouchId}`;
          await this.sendRetouchToUser(url, user, type, messageType);
        }
      } catch (e) {
        console.error('Error in getPhoto', e);
        await this.sentLocalizedSupportMessage(ctx, 'file_upload_error');
      }
    }
  }

  // Активация промокода (инициализация)
  @Command('promo')
  async activatePromo(ctx: Context) {
    if (ctx.from?.id !== undefined) {
      this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

      this.promoCodeSet.add(BigInt(ctx.from.id));
      this.sentLocalizedSupportMessage(ctx, 'promo_code');
    }
  }

  // отправка кнопок для выбора флаконов
  private async sendVialSelection(ctx: Context, user: User, retouchId: string) {
    if (!ctx.from?.id) return;

    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const selectedVials = await this.userService.getSelectedVialsId(user.id);
    const allVials = await this.vialsService.getAll();

    const keyboard = allVials.map((vial) => {
      const isSelected = selectedVials.includes(vial.id);
      return [
        Markup.button.callback(
          `${isSelected ? '✅' : '➕'} ${vial.name}`,
          `choiceVial_${vial.id}_${retouchId}`,
        ),
      ];
    });

    keyboard.push([
      Markup.button.callback(
        selectedVials.length > 0
          ? await this.getLocalizedSupportMessage(user.language, 'finish')
          : await this.getLocalizedSupportMessage(
              user.language,
              'continue_without_vials',
            ),
        `goToChoiceWatermark_${retouchId}`,
      ),
    ]);

    const sendMessage = await ctx.reply(
      await this.getLocalizedSupportMessage(user.language, 'choose_vials'),
      {
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
      },
    );

    if (sendMessage.message_id !== undefined)
      this.vialSelectionMessageId.set(user.id, sendMessage.message_id);
  }

  @Command('buy')
  async buy(ctx: Context) {
    if (ctx.from?.id === undefined) return;

    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;

    const globalDiscount = await this.discountService.getDiscount();

    let personalDiscountSum = 0;
    let personalDiscountPercent = 0;

    if (user.discountId) {
      const promocode = await this.promoCodeService.getPromoCodeByID(
        user.discountId,
      );
      if (promocode) {
        if (promocode.discountPercentage > 0)
          personalDiscountPercent = promocode.discountPercentage;
        else if (promocode.discountSum > 0)
          personalDiscountSum = promocode.discountSum;
      }
    }

    const products = (
      await this.productService.getAllProducts({
        status: 'active',
      })
    ).products;

    const buttons: InlineKeyboardButton[][] = [];
    const hasAnyDiscount =
      globalDiscount > 0 ||
      personalDiscountPercent > 0 ||
      personalDiscountSum > 0;

    for (const product of products) {
      const basePrice = product.price;

      let discountedPrice = basePrice;
      if (globalDiscount > 0) discountedPrice *= 1 - globalDiscount / 100;
      if (personalDiscountPercent > 0)
        discountedPrice *= 1 - personalDiscountPercent / 100;
      if (personalDiscountSum > 0) discountedPrice -= personalDiscountSum;

      const finalPrice = Math.max(1, Math.round(discountedPrice));

      let textLine;
      if (hasAnyDiscount) {
        textLine = this.getLocalizedSupportMessage(
          user.language,
          'product_price_with_discount',
          new Map([
            ['productName', escapeMarkdownV2(product.name)],
            ['oldPrice', basePrice.toString()],
            ['newPrice', finalPrice.toString()],
          ]),
        );
      } else {
        textLine = this.getLocalizedSupportMessage(
          user.language,
          'product_price',
          new Map([
            ['productName', escapeMarkdownV2(product.name)],
            ['price', finalPrice.toString()],
          ]),
        );
      }

      buttons.push([
        Markup.button.callback(
          await textLine,
          `buy_${product.id}_${finalPrice}`,
        ),
      ]);
    }
    const messageText = hasAnyDiscount
      ? await this.getLocalizedSupportMessage(
          user.language,
          'all_products_with_discount',
        )
      : await this.getLocalizedSupportMessage(user.language, 'all_products');

    await ctx.reply(messageText, {
      parse_mode: 'MarkdownV2',
      ...Markup.inlineKeyboard(buttons),
    });
  }

  @Action(/buy_.+/)
  async buyAction(@Ctx() ctx: Context) {
    ctx.deleteMessage();

    if (!ctx.from) return;
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;

    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const productId = callbackQuery.data.split('_')[1];
    const productPrice = callbackQuery.data.split('_')[2];

    const product = await this.productService.getProduct(+productId);
    if (!product) {
      await ctx.answerCbQuery('Товар не найден');
      return;
    }

    const activePromocode =
      user.discountId !== null
        ? await this.promoCodeService.getPromoCodeByID(user.discountId)
        : null;

    const invoiceId = `INV-${Date.now()}`;
    const accountId = `tg-${user.id}`;
    const promocode = activePromocode?.code || null;

    const data = {
      telegram_user_id: user.id.toString(),
      generations: product.generationCount,
      promocode: promocode,
      original_amount: product.price,
      product: productId,
    };

    const paymentParams = {
      description: `Покупка ${product.generationCount} генераций для обработки изображений.`,
      amount: productPrice,
      currency: 'RUB',
      invoiceId,
      accountId,
      data: JSON.stringify(data),
    };

    const paymentQuery = urlencode.stringify(paymentParams);

    const paymentUrl = `${process.env.PAYMENT_TERMINAL_API_URL}?${paymentQuery}`;

    const text = await this.getLocalizedSupportMessage(
      user.language,
      'payment_text',
      new Map([
        ['count', product.generationCount.toString()],
        ['amount', product.price.toString()],
        ['amountWithoutDiscount', productPrice],
        ['promoCode', activePromocode?.code || ''],
      ]),
    );

    const buttonText = await this.getLocalizedSupportMessage(
      user.language,
      'pay_button',
    );

    const cancelText = await this.getLocalizedSupportMessage(
      user.language,
      'back_button',
    );

    const message = await ctx.reply(text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: buttonText, url: paymentUrl }],
          [{ text: cancelText, callback_data: 'cancel_payment' }],
        ],
      },
    });

    if (message.message_id)
      this.paymentMessageId.set(+user.id, message.message_id);
  }

  async confirmPayment(paymentData: any, payment: Payment) {
    const user = await this.userService.getUserById(payment.userId);
    if (!user) return;
    this.userService.updateUserLastActiveDate(BigInt(user.telegramId));

    const messageId = this.paymentMessageId.get(user.id);

    const product = (
      await this.productService.getProduct(+paymentData.productId)
    ).name;
    if (messageId) {
      const paymentMap = new Map([
        ['promoCode', paymentData.promoCode || ''],
        ['productName', product],
        ['productId', payment.productId],
        ['userId', user.telegramId.toString()],
        ['username', `${user.telegramUsername}` || ''],
        ['name', user.telegramUsername],
        ['amount', payment.amount.toString()],
        ['count', payment.generationCount.toString()],
        ['totalGenerations', user.paymentGenerationCount.toString()],
      ]);

      const text = await this.getLocalizedSupportMessage(
        user.language,
        'payment_success',
        paymentMap,
      );

      try {
        await this.bot.telegram.editMessageText(
          Number(user.telegramId),
          messageId,
          undefined,
          text,
        );
      } catch (e) {
        console.error('Error deleting payment message:', e);
      }
      this.paymentMessageId.delete(user.id);

      const message = await this.getLocalizedSupportMessage(
        'RU',
        'payment_success_admin',
        paymentMap,
      );
      await this.sendMessageToAdmin(message);
    }
  }

  @Action('cancel_payment')
  async cancelPayment(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));
    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;
    ctx.deleteMessage();
    await this.buy(ctx);
  }

  @Action(/choiceVial_.+/)
  async toggleVial(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );

    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;

    const [_, vialId, retouchId] = callbackQuery.data.split('_');

    let selectedVials = await this.userService.getSelectedVialsId(user.id);

    if (selectedVials.includes(+vialId)) {
      await this.userService.removeSelectedVial(user.id, +vialId);
      selectedVials = selectedVials.filter((id) => id !== +vialId);
    } else {
      if (
        selectedVials.length >= (Number(process.env.MAX_VIALS_SELECTED) || 2)
      ) {
        if (this.maxVialsSelected.has(user.id)) {
          try {
            await this.bot.telegram.deleteMessage(
              Number(user.telegramId),
              this.maxVialsSelected.get(user.id)!,
            );
          } catch (e) {
            Logger.error(
              `Error deleting max vials message to user:${user.telegramId} \n${e}`,
            );
          }
        }
        const message = await this.sentLocalizedSupportMessage(
          ctx,
          'max_vials_selected',
        );
        if (message?.message_id)
          this.maxVialsSelected.set(user.id, message.message_id);

        return;
      }
      this.userService.addSelectedVial(user.id, +vialId);
      selectedVials.push(+vialId);
    }

    const allVials = await this.vialsService.getAll();

    const keyboard = allVials.map((vial) => {
      const isSelected = selectedVials.includes(vial.id);
      return [
        Markup.button.callback(
          `${isSelected ? '✅' : '➕'} ${vial.name}`,
          `choiceVial_${vial.id}_${retouchId}`,
        ),
      ];
    });

    keyboard.push([
      Markup.button.callback(
        selectedVials.length > 0
          ? await this.getLocalizedSupportMessage(user.language, 'finish')
          : await this.getLocalizedSupportMessage(
              user.language,
              'continue_without_vials',
            ),
        `goToChoiceWatermark_${retouchId}`,
      ),
    ]);

    const messageId = this.vialSelectionMessageId.get(user.id);
    if (messageId) {
      if (!ctx.chat) return;
      await ctx.telegram.editMessageReplyMarkup(
        ctx.chat.id,
        +messageId,
        undefined, // Не меняем inline_message_id
        { inline_keyboard: keyboard },
      );
      return; // Редактируем и выходим, не отправляя новое сообщение
    }
    await this.sendVialSelection(ctx, user, retouchId);
  }

  // Получение информации о поддержке
  @Command('support')
  async supportCommand(ctx: Context) {
    if (!ctx.from) return;
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;
    try {
      const supportMessages = await this.supportService.getAll();

      if (!supportMessages.length) {
        await this.sentLocalizedSupportMessage(ctx, 'no_info_support');
        return;
      }

      const formattedMessage = await Promise.all(
        supportMessages.map(
          async (item) =>
            await this.getLocalizedSupportMessage(
              user.language,
              'support_message',
              new Map([['username', item.info]]),
            ),
        ),
      );
      await ctx.reply(formattedMessage.join('\n\n'));
    } catch (error) {
      console.error('Ошибка получения данных поддержки:', error);
    }
  }

  // Переход к выбору водяного знака
  @Action(/goToChoiceWatermark_.+/)
  async askForWatermark(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;

    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;

    const retouchId = callbackQuery.data.replace('goToChoiceWatermark_', '');

    try {
      const oldMessageId = this.vialSelectionMessageId.get(user.id);

      await ctx.deleteMessage(oldMessageId);
    } catch (e) {
      console.error('Error deleting message:', e);
    }

    const message = await ctx.reply(
      await this.getLocalizedSupportMessage(
        user.language,
        'watermark_question',
      ),
      Markup.inlineKeyboard([
        Markup.button.callback(
          await this.getLocalizedSupportMessage(user.language, 'yes'),
          `watermark_yes_${retouchId}`,
        ),

        Markup.button.callback(
          await this.getLocalizedSupportMessage(user.language, 'no'),
          `watermark_no_${retouchId}`,
        ),

        Markup.button.callback(
          await this.getLocalizedSupportMessage(user.language, 'my_watermark'),
          `watermark_my_${retouchId}`,
        ),
      ]),
    );

    if (message.message_id)
      this.vialSelectionMessageId.set(user.id, message.message_id);
  }

  // Выбор языка (отправка кнопок)
  @Command('language')
  async changeLanguage(ctx: Context) {
    if (!ctx.from) return;
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;
    ctx.reply(
      await this.getLocalizedSupportMessage(user.language, 'choose_language'),
      Markup.inlineKeyboard([
        Markup.button.callback(
          await this.getLocalizedSupportMessage(user.language, 'RU'),
          'language_RU',
        ),
        Markup.button.callback(
          await this.getLocalizedSupportMessage(user.language, 'EN'),
          'language_EN',
        ),
      ]),
    );
  }

  // Отправка сообщения администратору
  async sentMessageToAdmin(message: string) {
    const admins = process.env.ADMIN_CHAT_ID?.split(',') || [];
    admins.forEach(async (admin) => {
      try {
        await this.bot.telegram.sendMessage(admin, message);
      } catch (e) {
        console.error('Error in sentMessageToAdmins', e);
      }
    });
  }

  // изменение настроек ретуши
  @Command('photosettings')
  async photoSettings(ctx: Context) {
    if (ctx.from?.id === undefined) return;
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    const settingsId = await this.settingsService.getUserSettings(user.id);

    if (user.paymentGenerationCount <= 0) {
      await this.sentLocalizedSupportMessage(ctx, 'u_need_add_balance_setting');
      return;
    }

    const buttons = await Promise.all(
      this.modes.map(async ({ key, id }) => [
        Markup.button.callback(
          `${await this.getLocalizedSupportMessage(user.language, key)} ${settingsId === id ? '✅ ' : ''}`,
          key,
        ),
      ]),
    );
    await ctx.reply(
      await this.getLocalizedSupportMessage(user.language, 'choose_mode'),
      Markup.inlineKeyboard(buttons),
    );
  }

  // Выбор языка
  @Action(/language_.+/)
  async changeLanguageAction(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const language = callbackQuery.data.split('_')[1];
    await this.userService.updateLanguage(user.id, language as LanguageEnum);
    await ctx.answerCbQuery(
      await this.getLocalizedSupportMessage(language, 'language_changed'),
    );
    await ctx.editMessageText(
      await this.getLocalizedSupportMessage(language, 'language_changed'),
    );
    await this.setUserCommands(ctx);
  }

  // Выбор водяного знака
  @Action(/watermark_.+/)
  async handleWatermarkSelection(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const [_, choice, retouchId] = callbackQuery.data.split('_');
    if (!ctx.from) return;
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );

    const messageId = this.vialSelectionMessageId.get(user.id);
    if (!messageId || !ctx.chat) return;
    try {
      await ctx.deleteMessage(messageId);
    } catch (e) {
      console.error('Error deleting message:', e);
    }

    let watermarkBuffer: Buffer | undefined;
    const addWatermark = choice === 'yes';

    if (addWatermark) {
      watermarkBuffer = await sharp('./media/watermark.png').toBuffer();

      try {
        await this.sendRetouchToUser(
          `${this.url}getFile/${retouchId}`,
          user,
          GenerationType.PAID,
          'photo',
          true,
          watermarkBuffer,
        );
      } catch (e) {
        console.error('Error in handleWatermarkSelection', e);
      }
    } else if (choice === 'my') {
      await this.sentLocalizedSupportMessage(ctx, 'my_watermark');
      this.watermarkMessageId.set(user.id, retouchId);
    } else if (choice === 'no') {
      try {
        await this.sendRetouchToUser(
          `${this.url}getFile/${retouchId}`,
          user,
          GenerationType.PAID,
          'photo',
          false,
        );
      } catch (e) {
        console.error('Error in handleWatermarkSelection', e);
      }
    }
  }

  // Отправка фото пользователю
  async sendPhotoToUserB(
    userId: number,
    buffer: Buffer,
    photo: boolean = true,
    message: string = '',
  ) {
    try {
      if (photo)
        await this.bot.telegram.sendPhoto(
          userId,
          { source: buffer },
          { caption: message },
        );
      else
        await this.bot.telegram.sendDocument(
          userId,
          { source: buffer },
          { caption: message },
        );
    } catch (e) {
      console.error('Error in sendPhotoToUser', e);
    }
  }

  // Получение информации о пользователе
  @Command('generations')
  async addGenerations(ctx: Context) {
    if (ctx.from?.id !== undefined) {
      this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

      const user = await this.userService.getUserByTelegramId(
        BigInt(ctx.from.id),
      );
      if (!user) return;
      const param = new Map([
        ['freeGenerations', user.freeGenerationCount.toString()],
        ['paidGenerations', user.paymentGenerationCount.toString()],
      ]);
      await this.sentLocalizedSupportMessage(ctx, 'user_generations', param);
    } else await this.sentLocalizedSupportMessage(ctx, 'error_no_user');
  }

  // Обновление статуса генерации
  async updateGenerationStatus(id: string, user: User) {
    let status = await this.getGenerationStatus(id);
    while (status.progress != 100 && status.state !== 'completed') {
      await new Promise((r) => setTimeout(r, 1000));
      status = await this.getGenerationStatus(id);

      const progressBar = await getProgressBar(status.progress);

      const text = await this.getLocalizedSupportMessage(
        user.language,
        'photo_sent',
        new Map([['progress', progressBar]]),
      );

      try {
        await this.bot.telegram.editMessageText(
          Number(user.telegramId),
          this.progressMessageId.get(id),
          undefined,
          text,
        );
      } catch (e) {
        console.error('Error updating generation status:', e);
      }
    }
  }

  // Получение статуса генерации
  async getGenerationStatus(id: string) {
    const url = process.env.RETOUCH_API + 'status/' + id;
    const response = await axios.get(url);
    return await response.data;
  }

  // Отправка ретуши пользователю
  async sendRetouchToUser(
    photoURL: string,
    user: User,
    retouchType: GenerationType,
    messageType: 'photo' | 'document',
    applyWatermark = true,
    customWatermarkBuffer?: Buffer,
  ) {
    let retouch;

    if (retouchType === GenerationType.FREE)
      retouch = await this.retouchService.addVialsAndWatermark(photoURL);
    else {
      const vials = await this.vialsService.getVialsURLByUser(user.id);
      retouch = await this.retouchService.addVialsAndWatermark(
        photoURL,
        vials,
        applyWatermark,
        customWatermarkBuffer,
      );
    }
    const message = await this.getLocalizedSupportMessage(
      user.language,
      'thanks_for_using',
    );
    await this.sendPhotoToUserB(
      Number(user.telegramId),
      retouch,
      messageType === 'photo',
      message,
    );
  }

  // Отправка локализованного сообщения
  async sentLocalizedSupportMessage(
    @Ctx() ctx: Context,
    messageType: string,
    paramMessage?: Map<string, string>,
    language = 'EN',
  ): Promise<Message.TextMessage | undefined> {
    if (!ctx.from) return;
    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;

    const message = await this.getLocalizedSupportMessage(
      user.language ? user.language : language,
      messageType,
      paramMessage,
    );

    return await ctx.reply(message);
  }

  // Получение локализованного сообщения
  async getLocalizedSupportMessage(
    language = 'EN',
    messageType: string,
    paramMessage?: Map<string, string>,
  ): Promise<string> {
    if (!messageType.endsWith('_EN') || !messageType.endsWith('_RU'))
      messageType = `${messageType}_${language}`;
    let message = await this.localizationService.getMessage(messageType);

    if (paramMessage) {
      for (const [key, value] of paramMessage)
        message = message.replace(`\${${key}\}`, value);
    }
    return message;
  }

  // Переключение режима обработки
  @Action(['mode_light', 'mode_medium', 'mode_hard'])
  async changeMode(ctx: Context) {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;

    if (ctx.from?.id === undefined || callbackQuery.data === undefined) return;

    const mode = this.modes.find((m) => m.key === callbackQuery.data);
    if (mode === undefined) return;
    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;
    await this.settingsService.changeUserSettings(user.id, mode?.id);
    const message = await this.getLocalizedSupportMessage(
      user.language,
      'mode_changed',
      new Map([
        [
          'mode',
          await this.getLocalizedSupportMessage(user.language, mode.key),
        ],
      ]),
    );
    await ctx.answerCbQuery(message);
    await ctx.reply(message);
    if (callbackQuery.message?.message_id !== undefined)
      await ctx.deleteMessage();
  }

  // Отправка сообщения нескольким пользователям
  async sentMessageToUsers(
    message: string,
    usersId: number[] | undefined,
    photos: Express.Multer.File[] = [],
    pinned: boolean = false,
  ) {
    if (photos.length > 10) {
      console.error(
        'Too many photos to send in a single message. Limit is 10.',
      );
      return;
    }
    const users = await this.userService.getUsersTelegramId(usersId);
    const pinnedUpdates: { userId: bigint; messageId: number }[] = [];

    for (const user of users) {
      const userId = Number(user.telegramId);

      try {
        if (photos.length === 0) {
          const sentMessage = await this.sentMessageToUser(message, userId);

          if (pinned && sentMessage?.message_id) {
            if (user.pinnedMessages.length > 0) {
              await this.bot.telegram.unpinChatMessage(
                userId,
                user.pinnedMessages[0],
              );
            }

            await this.bot.telegram.pinChatMessage(
              userId,
              sentMessage.message_id,
              {
                disable_notification: true,
              },
            );

            pinnedUpdates.push({
              userId: BigInt(user.telegramId),
              messageId: sentMessage.message_id,
            });
          }
        } else {
          const mediaGroup: InputMediaPhoto[] = photos.map((photo, index) => ({
            type: 'photo',
            media: { source: photo.buffer },
            caption: index === 0 ? message : undefined,
          }));

          const sentMessages = await this.bot.telegram.sendMediaGroup(
            userId,
            mediaGroup,
          );

          // Пин первого сообщения из группы
          if (pinned) {
            const pinMessage = await this.bot.telegram.pinChatMessage(
              userId,
              sentMessages[0].message_id,
              {
                disable_notification: true,
              },
            );

            if (user.pinnedMessages.length > 0) {
              await this.bot.telegram.deleteMessage(
                userId,
                user.pinnedMessages[0],
              );
            }
            pinnedUpdates.push({
              userId: BigInt(user.telegramId),
              messageId: sentMessages[0].message_id,
            });
          }
        }
      } catch (error) {
        Logger.error(
          `Failed to send message to user ${userId}: ${error.message}`,
        );
      }
    }
    if (pinnedUpdates.length > 0) {
      await this.userService.addPinnedMessage(pinnedUpdates);
    }
  }

  // Отправка сообщения пользователю
  async sentMessageToUser(message: string, userId: number) {
    try {
      return await this.bot.telegram.sendMessage(userId, message);
    } catch (e) {
      console.error('Error in sentMessageToUser', e);
    }
  }

  // Установка команд пользователя
  async setUserCommands(ctx: Context) {
    if (ctx.from?.id === undefined) return;
    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    if (!user) return;
    this.bot.telegram.setMyCommands([
      {
        command: 'start',
        description: await this.getLocalizedSupportMessage(
          user.language,
          'command_start',
        ),
      },
      {
        command: 'support',
        description: await this.getLocalizedSupportMessage(
          user.language,
          'command_support',
        ),
      },
      {
        command: 'generations',
        description: await this.getLocalizedSupportMessage(
          user.language,
          'command_generation',
        ),
      },
      {
        command: 'buy',
        description: await this.getLocalizedSupportMessage(
          user.language,
          'command_buy',
        ),
      },

      {
        command: 'promo',
        description: await this.getLocalizedSupportMessage(
          user.language,
          'command_promo',
        ),
      },
      {
        command: 'language',
        description: await this.getLocalizedSupportMessage(
          user.language,
          'command_language',
        ),
      },
      {
        command: 'photosettings',
        description: await this.getLocalizedSupportMessage(
          user.language,
          'command_settings',
        ),
      },
    ]);
  }

  @On('text')
  async text(ctx: Context) {
    if (ctx.from?.id === undefined) return;
    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const message = ctx.message as Message.TextMessage;

    console.log('Text message received:', message.text);

    if (this.promoCodeSet.has(BigInt(ctx.from.id))) {
      this.promoCodeSet.delete(BigInt(ctx.from.id));
      try {
        await this.promoCodeService.checkPromoCode(message.text, user.id);
      } catch (e) {
        console.error('Error in promoCodeService.checkPromoCode', e);
        await this.sentLocalizedSupportMessage(ctx, e.message);
        return;
      }

      const { type, count } = await this.promoCodeService.activatePromoCode(
        message.text,
        user.id,
      );

      if (type === 'generationCount') {
        await this.sentLocalizedSupportMessage(
          ctx,
          'promo_code_activated_generation',
          new Map([['count', count.toString()]]),
        );
      } else if (type === 'discountPercentage') {
        await this.sentLocalizedSupportMessage(
          ctx,
          'promo_code_activated_discount',
          new Map([['discount', count.toString()]]),
        );
      } else if (type === 'discountSum') {
        await this.sentLocalizedSupportMessage(
          ctx,
          'promo_code_activated_discount_sum',
          new Map([['discount', count.toString()]]),
        );
      }
    } else await this.sentLocalizedSupportMessage(ctx, 'unknown_command');
  }

  async sendMessageToAdmin(message: string) {
    console.log('Sending message to admin:', message);
    const admins = process.env.ADMIN_CHAT_ID?.split(',') || [];
    console.log('Admin IDs:', admins);
    admins.forEach(async (admin) => {
      try {
        await this.bot.telegram.sendMessage(Number(admin), message);
      } catch (e) {
        console.error('Error in sendMessageToAdmin', e);
      }
    });
  }

  async sendVideo(ctx: Context, videoPath: string, message: string) {
    if (ctx.from?.id === undefined) return;
    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;
    try {
      await ctx.replyWithVideo({ source: videoPath }, { caption: message });
    } catch (e) {
      console.error('Error in sendVideo', e);
    }
  }
}

async function getProgressBar(percent: number): Promise<string> {
  const totalBlocks = 15;
  const filledBlockChar = '█';
  const emptyBlockChar = '░';

  const filledBlocks = Math.max(1, Math.round((percent / 100) * totalBlocks));
  const emptyBlocks = totalBlocks - filledBlocks;

  return `[${filledBlockChar.repeat(filledBlocks)}${emptyBlockChar.repeat(emptyBlocks)}] ${percent}%`;
}

export function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const outputBuffer = await heicConvert({
    buffer,
    format: 'JPEG',
    quality: 1,
  });

  return outputBuffer;
}
