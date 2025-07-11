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
  private readonly logger = new Logger(BotUpdate.name);
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
  private retouchIdMap = new Map<number, string>();
  private userVialsSelection = new Map<number, boolean>(); // Хранит информацию о выборе флаконов
  private vialErrorMessageId = new Map<number, number>(); // Хранит ID сообщения об ошибке превышения лимита флаконов
  private paymentMessageId = new Map<number, number>();
  private progressMessageId = new Map<string, number>();
  private categorySelectionMessageId = new Map<number, number>();

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
    this.logger.log('📱 Start command received');

    if (ctx.from) {
      this.logger.log(
        `👤 Processing start command for user: ${ctx.from.id} (@${ctx.from.username || 'no_username'})`,
      );

      try {
        const userExists = await this.userService.userIsExistsByTelegramId(
          ctx.from.id,
        );

        if (userExists) {
          this.logger.log(`✅ Existing user ${ctx.from.id} welcomed back`);
          await this.sentLocalizedSupportMessage(ctx, 'welcome_back');
          this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));
        } else {
          this.logger.log(`🆕 Creating new user: ${ctx.from.id}`);
          const userTg: CreateUserDto = {
            telegramId: BigInt(ctx.from.id),
            username: ctx.from.username || '',
            fullName:
              `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim(),
            language: ctx.from.language_code === 'ru' ? 'RU' : 'EN',
          };
          const newUser = await this.userService.create(userTg);
          this.logger.log(`✅ New user created successfully: ${newUser.id}`);

          await this.setUserCommands(ctx);

          const caption = await this.getLocalizedSupportMessage(
            newUser.language,
            'welcome',
            new Map([['name', userTg.fullName]]),
          );

          await this.sendVideo(ctx, './media/welcome.mp4', caption);
          this.logger.log(`🎬 Welcome video sent to user ${ctx.from.id}`);
        }
      } catch (e) {
        this.logger.error(
          `❌ Error in startCommand for user ${ctx.from.id}:`,
          e.message || e,
        );
      }
    } else {
      this.logger.warn('⚠️ Start command received without user context');
    }
  }

  @On(['photo', 'document'])
  async getPhoto(@Ctx() ctx: Context) {
    if (ctx.from === undefined) return;

    this.logger.log(`📸 Photo/document received from user: ${ctx.from.id}`);

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from?.id),
    );
    if (!user) {
      this.logger.error(`❌ User ${ctx.from.id} not found in database`);
      return;
    }

    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    // Проверяем доступные генерации
    if (user.paymentGenerationCount <= 0 && user.freeGenerationCount <= 0) {
      this.logger.warn(
        `⚠️ User ${ctx.from.id} has no available generations (paid: ${user.paymentGenerationCount}, free: ${user.freeGenerationCount})`,
      );
      await this.sentLocalizedSupportMessage(ctx, 'generations_expired');
      return;
    }

    this.logger.log(
      `💰 User ${ctx.from.id} generations - Paid: ${user.paymentGenerationCount}, Free: ${user.freeGenerationCount}`,
    );

    let fileLink, messageType;

    if ((ctx.message as Message.PhotoMessage).photo) {
      messageType = 'photo';
      const photo = (ctx.message as Message.PhotoMessage).photo;
      fileLink = await ctx.telegram.getFileLink(
        photo[photo.length - 1].file_id,
      );
      this.logger.log(
        `📷 Photo file link retrieved for user ${ctx.from.id}, size: ${photo[photo.length - 1].file_size || 'unknown'} bytes`,
      );
    } else if ((ctx.message as Message.DocumentMessage).document) {
      messageType = 'document';
      const document = (ctx.message as Message.DocumentMessage).document;
      fileLink = await ctx.telegram.getFileLink(document.file_id);
      this.logger.log(
        `📄 Document file link retrieved for user ${ctx.from.id}, type: ${document.mime_type || 'unknown'}, size: ${document.file_size || 'unknown'} bytes`,
      );
    }

    if (!fileLink || !this.url || !this.token) {
      this.logger.error(
        `❌ Missing required data for user ${ctx.from.id}: fileLink=${!!fileLink}, url=${!!this.url}, token=${!!this.token}`,
      );
      return;
    }

    if (this.watermarkMessageId.has(user.id)) {
      this.logger.log(`🎨 Processing custom watermark for user ${user.id}`);
      await this.sentLocalizedSupportMessage(ctx, 'watermark_upload_success');
      const retouchId = this.watermarkMessageId.get(user.id)!;
      this.watermarkMessageId.delete(user.id);

      try {
        const response = await axios.get(fileLink.href, {
          responseType: 'arraybuffer',
        });
        const watermarkBuffer = Buffer.from(response.data);
        const applyVials = this.userVialsSelection.get(user.id) || false;

        this.logger.log(
          `✨ Applying custom watermark to retouch ${retouchId} for user ${user.id}, vials: ${applyVials}`,
        );

        await this.sendRetouchToUser(
          `${this.url}getFile/${retouchId}`,
          user,
          GenerationType.PAID,
          'photo',
          true,
          watermarkBuffer,
          applyVials,
        );

        // Очищаем данные после использования
        this.retouchIdMap.delete(user.id);
        this.userVialsSelection.delete(user.id);
        this.logger.log(
          `🧹 Cleaned up user data for ${user.id} after custom watermark`,
        );
      } catch (e) {
        this.logger.error(
          `❌ Error while applying custom watermark for user ${user.id}:`,
          e,
        );
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
        this.logger.warn(`⚠️ User ${ctx.from.id} has no generations available`);
        await this.sentLocalizedSupportMessage(ctx, 'no_generations');
        return;
      }

      this.logger.log(
        `🎯 Processing ${type} generation for user ${ctx.from.id}`,
      );

      try {
        const response = await axios.get(fileLink?.href, {
          responseType: 'arraybuffer',
        });

        let fileBuffer = Buffer.from(response.data);
        this.logger.log(
          `📦 Downloaded file for user ${ctx.from.id}, size: ${fileBuffer.length} bytes`,
        );

        try {
          fileBuffer = await sharp(fileBuffer)
            .jpeg({ quality: 100 })
            .toBuffer();
          this.logger.log(`🔧 Image converted to JPEG for user ${ctx.from.id}`);
        } catch (error: any) {
          if (error.message.includes('No decoding plugin')) {
            this.logger.log(
              `🔄 Converting HEIC to JPEG for user ${ctx.from.id}`,
            );
            fileBuffer = await convertHeicToJpeg(fileBuffer);
          } else {
            this.logger.error(
              `❌ Error converting image for user ${ctx.from.id}:`,
              error,
            );
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
          generationNumber:
            user.paymentGenerationCount + user.freeGenerationCount,
        });

        this.logger.log(
          `🚀 Photo sent for retouching, retouchId: ${retouchId}, user: ${ctx.from.id}, type: ${type}`,
        );

        const progressBar = await getProgressBar(0);
        const text = await this.getLocalizedSupportMessage(
          user.language,
          'photo_sent',
          new Map([['progress', progressBar]]),
        );
        const sendMessage = await ctx.reply(text);
        this.progressMessageId.set(retouchId, sendMessage.message_id);

        this.logger.log(
          `⏳ Starting progress tracking for retouch ${retouchId}`,
        );
        await this.updateGenerationStatus(retouchId, user);

        await ctx.deleteMessage(sendMessage.message_id);
        this.progressMessageId.delete(retouchId);

        await this.sentLocalizedSupportMessage(ctx, 'photo_processed');
        this.logger.log(
          `✅ Photo processing completed for retouch ${retouchId}`,
        );

        if (type === GenerationType.PAID) {
          // Сохраняем retouchId для последующего использования
          this.retouchIdMap.set(user.id, retouchId);
          this.logger.log(
            `💎 Starting vial selection process for user ${ctx.from.id}, retouchId: ${retouchId}`,
          );
          await this.askAddVials(ctx);
        } else {
          this.logger.log(
            `🆓 Processing free generation for user ${ctx.from.id}, retouchId: ${retouchId}`,
          );
          await this.sentLocalizedSupportMessage(ctx, 'u_need_add_balance');
          const url = `${this.url}getFile/${retouchId}`;
          await this.sendRetouchToUser(url, user, type, messageType);
        }
      } catch (e) {
        this.logger.error(`❌ Error in getPhoto for user ${ctx.from.id}:`, e);
        await this.sentLocalizedSupportMessage(ctx, 'file_upload_error');
      }
    }
  }

  @Command('promo')
  async activatePromo(ctx: Context) {
    if (ctx.from?.id !== undefined) {
      this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

      this.promoCodeSet.add(BigInt(ctx.from.id));
      this.sentLocalizedSupportMessage(ctx, 'promo_code');
    }
  }

  @Command('test')
  private async askAddVials(ctx: Context) {
    if (!ctx.from?.id) return;

    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );

    const keyboard: InlineKeyboardButton[][] = [
      [
        Markup.button.callback(
          await this.getLocalizedSupportMessage(user.language, 'no'),
          'choiceAddVials_No',
        ),
        Markup.button.callback(
          await this.getLocalizedSupportMessage(user.language, 'yes'),
          'choiceAddVials_Yes',
        ),
      ],
    ];

    const sendMessage = await ctx.reply(
      await this.getLocalizedSupportMessage(user.language, 'AskAddVials'),
      {
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
      },
    );
  }

  @Action(/choiceAddVials_.+/)
  private async ActionAddVials(ctx: Context) {
    if (!ctx.from) return;

    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const [_, choice] = callbackQuery.data.split('_');

    this.logger.log(`🧪 User ${ctx.from.id} choice for vials: ${choice}`);

    try {
      ctx.deleteMessage();
    } catch (error) {
      Logger.warn(
        'Error deleting message in ActionAddVials:',
        error.message || error,
      );
    }
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;

    // Получаем retouchId из карты
    const retouchId = this.retouchIdMap.get(user.id);
    if (!retouchId) {
      this.logger.error(`❌ RetouchId not found for user: ${user.id}`);
      return;
    }

    if (choice === 'No') {
      this.logger.log(
        `❌ User ${user.id} declined vials, proceeding to watermark selection`,
      );
      await this.askForWatermark(ctx, false, retouchId);
    } else if (choice === 'Yes') {
      this.logger.log(
        `✅ User ${user.id} wants to add vials, showing categories`,
      );
      await this.sendPaginatedCategorySelection(ctx, user, retouchId);
    }
  }

  private async sendPaginatedCategorySelection(
    ctx: Context,
    user: User,
    retouchId: string,
    page: number = 1,
    perPage: number = 5,
  ) {
    if (!ctx.from?.id) return;

    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const allCategories = await this.vialsService.getAllCategories();
    const paginatedCategories = allCategories.slice(
      (page - 1) * perPage,
      page * perPage,
    );

    const totalPages = Math.ceil(allCategories.length / perPage);

    const keyboard = paginatedCategories.map((category) => [
      Markup.button.callback(
        category.name,
        `choiceVialCategory_${retouchId}_${category.id}`,
      ),
    ]);

    const navigationButtons: any[] = [];

    if (page > 1) {
      navigationButtons.push(
        Markup.button.callback(
          await this.getLocalizedSupportMessage(user.language, 'previous_page'),
          `paginateCategories_${retouchId}_${page - 1}`,
        ),
      );
    }

    navigationButtons.push(
      Markup.button.callback(`${page}/${totalPages}`, 'current_page', true),
    );

    if (page < totalPages) {
      navigationButtons.push(
        Markup.button.callback(
          await this.getLocalizedSupportMessage(user.language, 'next_page'),
          `paginateCategories_${retouchId}_${page + 1}`,
        ),
      );
    }

    if (navigationButtons.length > 0) keyboard.push(navigationButtons);

    keyboard.push([
      Markup.button.callback(
        await this.getLocalizedSupportMessage(
          user.language,
          'continue_without_vials',
        ),
        `goToChoiceWatermark_${retouchId}`,
      ),
    ]);

    const sendMessage = await ctx.reply(
      await this.getLocalizedSupportMessage(user.language, 'choose_category'),
      {
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
      },
    );

    if (sendMessage.message_id !== undefined)
      this.categorySelectionMessageId.set(user.id, sendMessage.message_id);
  }

  @Action(/paginateCategories_.+/)
  async paginateCategories(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    try {
      ctx.deleteMessage();
    } catch (error) {
      Logger.warn(
        'Error deleting message in paginateCategories_:',
        error.message || error,
      );
    }
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;

    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const [_, retouchId, page] = callbackQuery.data.split('_');

    await this.sendPaginatedCategorySelection(ctx, user, retouchId, +page);
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
    try {
      ctx.deleteMessage();
    } catch (error) {
      Logger.warn('Error deleting message in buy_:', error.message || error);
    }
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
    this.logger.log(
      `💳 Confirming payment for user ${payment.userId} - Amount: ${payment.amount}, Product: ${paymentData.productId}`,
    );

    const user = await this.userService.getUserById(payment.userId);
    if (!user) {
      this.logger.error(
        `❌ User ${payment.userId} not found for payment confirmation`,
      );
      return;
    }

    this.userService.updateUserLastActiveDate(BigInt(user.telegramId));

    const messageId = this.paymentMessageId.get(user.id);

    const product = (
      await this.productService.getProduct(+paymentData.productId)
    ).name;

    if (messageId) {
      this.logger.log(
        `📝 Updating payment message for user ${user.id}, messageId: ${messageId}`,
      );

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
        this.logger.log(
          `✅ Payment confirmation sent to user ${user.telegramId}`,
        );
      } catch (e) {
        this.logger.error(
          `❌ Error updating payment message for user ${user.telegramId}:`,
          e,
        );
      }
      this.paymentMessageId.delete(user.id);

      const message = await this.getLocalizedSupportMessage(
        'RU',
        'payment_success_admin',
        paymentMap,
      );
      await this.sendMessageToAdmin(message);
      this.logger.log(
        `📢 Payment notification sent to admins for user ${user.telegramId}`,
      );
    } else {
      this.logger.warn(`⚠️ No payment message found for user ${user.id}`);
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
    try {
      ctx.deleteMessage();
    } catch (error) {
      Logger.warn(
        'Error deleting message in CancelPayment:',
        error.message || error,
      );
    }
    await this.buy(ctx);
  }

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

  @Action(/goToChoiceWatermark_.+/)
  async askForWatermark(
    @Ctx() ctx: Context,
    addVials: boolean = true,
    retouchIdParam?: string,
  ) {
    if (!ctx.from) return;
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;

    let retouchId: string;

    if (retouchIdParam) {
      // Если retouchId передан как параметр, используем его
      retouchId = retouchIdParam;
    } else {
      // Если нет, извлекаем из callback данных
      const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
      retouchId = callbackQuery.data.replace('goToChoiceWatermark_', '');
    }

    // Определяем, выбрал ли пользователь флаконы
    let hasSelectedVials = false;

    if (addVials) {
      // Если addVials = true, проверяем реально выбранные флаконы
      const selectedVials = await this.userService.getSelectedVialsId(user.id);
      hasSelectedVials = selectedVials.length > 0;
    }
    // Если addVials = false, значит пользователь выбрал "НЕТ" для флаконов

    // Сохраняем информацию о выборе флаконов
    this.userVialsSelection.set(user.id, hasSelectedVials);

    // Удаляем сообщение об ошибке, если оно есть
    await this.deleteVialErrorMessage(ctx, user.id);

    try {
      const oldMessageId = this.vialSelectionMessageId.get(user.id);
      if (oldMessageId) {
        await ctx.deleteMessage(oldMessageId);
      }
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
          `${await this.getLocalizedSupportMessage(user.language, key)} ${settingsId === id ? '✅' : ''}`,
          key,
        ),
      ]),
    );
    await ctx.reply(
      await this.getLocalizedSupportMessage(user.language, 'choose_mode'),
      Markup.inlineKeyboard(buttons),
    );
  }

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

  @Action(/watermark_.+/)
  async handleWatermarkSelection(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const [_, choice, retouchId] = callbackQuery.data.split('_');

    if (!ctx.from) return;
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );

    this.logger.log(
      `🎨 Watermark selection - User: ${user.id}, Choice: ${choice}, RetouchId: ${retouchId}`,
    );

    const messageId = this.vialSelectionMessageId.get(user.id);
    if (!messageId || !ctx.chat) return;

    // Удаляем сообщение об ошибке, если оно есть
    await this.deleteVialErrorMessage(ctx, user.id);

    try {
      await ctx.deleteMessage(messageId);
    } catch (e) {
      this.logger.warn(
        `⚠️ Error deleting watermark selection message for user ${user.id}:`,
        e,
      );
    }

    let watermarkBuffer: Buffer | undefined;
    const addWatermark = choice === 'yes';
    const applyVials = this.userVialsSelection.get(user.id) || false;

    this.logger.log(
      `⚙️ Processing watermark - User: ${user.id}, AddWatermark: ${addWatermark}, ApplyVials: ${applyVials}`,
    );

    if (addWatermark) {
      watermarkBuffer = await sharp('./media/watermark.png').toBuffer();
      this.logger.log(`🏷️ Default watermark loaded for user ${user.id}`);

      try {
        await this.sendRetouchToUser(
          `${this.url}getFile/${retouchId}`,
          user,
          GenerationType.PAID,
          'photo',
          true,
          watermarkBuffer,
          applyVials,
        );
        this.logger.log(
          `✅ Retouch sent to user ${user.id} with default watermark`,
        );
      } catch (e) {
        this.logger.error(
          `❌ Error sending retouch with watermark to user ${user.id}:`,
          e,
        );
      }

      // Очищаем данные после использования
      this.retouchIdMap.delete(user.id);
      this.userVialsSelection.delete(user.id);
    } else if (choice === 'my') {
      this.logger.log(
        `📤 User ${user.id} chose custom watermark, waiting for upload`,
      );
      await this.sentLocalizedSupportMessage(ctx, 'my_watermark');
      this.watermarkMessageId.set(user.id, retouchId);
    } else if (choice === 'no') {
      this.logger.log(`🚫 User ${user.id} chose no watermark`);
      try {
        await this.sendRetouchToUser(
          `${this.url}getFile/${retouchId}`,
          user,
          GenerationType.PAID,
          'photo',
          false,
          undefined,
          applyVials,
        );
        this.logger.log(`✅ Retouch sent to user ${user.id} without watermark`);
      } catch (e) {
        this.logger.error(
          `❌ Error sending retouch without watermark to user ${user.id}:`,
          e,
        );
      }

      // Очищаем данные после использования
      this.retouchIdMap.delete(user.id);
      this.userVialsSelection.delete(user.id);
    }

    this.logger.log(`🧹 Cleaned up processing data for user ${user.id}`);
  }

  async sendPhotoToUserB(
    userId: number,
    buffer: Buffer,
    photo: boolean = true,
    message: string = '',
  ) {
    this.logger.log(
      `📸 Sending ${photo ? 'photo' : 'document'} to user ${userId}, buffer size: ${buffer.length} bytes`,
    );

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

      this.logger.log(
        `✅ Successfully sent ${photo ? 'photo' : 'document'} to user ${userId}`,
      );
    } catch (e) {
      this.logger.error(
        `❌ Error sending ${photo ? 'photo' : 'document'} to user ${userId}:`,
        e,
      );
    }
  }

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

  async updateGenerationStatus(id: string, user: User) {
    this.logger.log(
      `⏳ Starting progress tracking for retouch ${id}, user: ${user.id}`,
    );
    let status = await this.getGenerationStatus(id);
    let lastProgress = 0;

    while (status.progress != 100 && status.state !== 'completed') {
      await new Promise((r) => setTimeout(r, 1000));
      status = await this.getGenerationStatus(id);

      // Логируем только при изменении прогресса
      if (status.progress !== lastProgress) {
        this.logger.log(
          `📊 Progress update for retouch ${id}: ${status.progress}% (state: ${status.state})`,
        );
        lastProgress = status.progress;
      }

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
        this.logger.warn(
          `⚠️ Error updating progress message for retouch ${id}:`,
          e,
        );
      }
    }

    this.logger.log(
      `✅ Progress tracking completed for retouch ${id}: ${status.progress}%`,
    );
  }

  async getGenerationStatus(id: string) {
    const url = process.env.RETOUCH_API + 'status/' + id;
    const response = await axios.get(url);
    return await response.data;
  }

  async sendRetouchToUser(
    photoURL: string,
    user: User,
    retouchType: GenerationType,
    messageType: 'photo' | 'document',
    applyWatermark = true,
    customWatermarkBuffer?: Buffer,
    applyVials = true,
  ) {
    this.logger.log(
      `📤 Sending retouch to user ${user.id} - Type: ${retouchType}, Watermark: ${applyWatermark}, Vials: ${applyVials}, MessageType: ${messageType}`,
    );

    let retouch;

    if (retouchType === GenerationType.FREE) {
      this.logger.log(
        `🆓 Processing free generation for user ${user.id} (no vials applied)`,
      );
      // Для бесплатных генераций флаконы не применяются
      retouch = await this.retouchService.addVialsAndWatermark(photoURL);
    } else {
      let vials: string[] = [];
      if (applyVials) {
        vials = await this.vialsService.getVialsURLByUser(user.id);
        this.logger.log(
          `🧪 Retrieved ${vials.length} vials for user ${user.id}: [${vials.join(', ')}]`,
        );
      } else {
        this.logger.log(
          `🚫 No vials applied for user ${user.id} (user choice)`,
        );
      }
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

    this.logger.log(
      `📬 Sending final result to user ${user.id} as ${messageType}`,
    );
    await this.sendPhotoToUserB(
      Number(user.telegramId),
      retouch,
      messageType === 'photo',
      message,
    );

    this.logger.log(`✅ Successfully sent retouch result to user ${user.id}`);
  }

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
      try {
        ctx.deleteMessage();
      } catch (error) {
        Logger.warn(
          'Error deleting message in mode_changed:',
          error.message || error,
        );
      }
  }

  async sentMessageToUsers(
    message: string,
    usersId: number[] | undefined,
    photos: Express.Multer.File[] = [],
    pinned: boolean,
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
      console.log(`Sending message to user ${userId}`);

      try {
        if (photos.length === 0) {
          const sentMessage = await this.sentMessageToUser(message, userId);

          if (pinned === true && sentMessage?.message_id) {
            if (user.pinnedMessages.length > 0) {
              console.log(`
              Unpinning previous message ${user.pinnedMessages[0]} for user ${userId},
            `);
              await this.bot.telegram.unpinChatMessage(
                userId,
                user.pinnedMessages[0],
              );
            }

            console.log(`
            Pinning new message ${sentMessage.message_id} for user ${userId},
          `);
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

          if (pinned === true && sentMessages?.length > 0) {
            const messageIdToPin = sentMessages[0].message_id;

            console.log(`
            Pinning first photo message ${messageIdToPin} for user ${userId},
          `);
            await this.bot.telegram.pinChatMessage(userId, messageIdToPin, {
              disable_notification: true,
            });

            if (user.pinnedMessages.length > 0) {
              console.log(`
              Deleting previous pinned message ${user.pinnedMessages[0]} for user ${userId},
            `);
              await this.bot.telegram.deleteMessage(
                userId,
                user.pinnedMessages[0],
              );
            }

            pinnedUpdates.push({
              userId: BigInt(user.telegramId),
              messageId: messageIdToPin,
            });
          }
        }
      } catch (error: any) {
        console.error(
          `Failed to send message to user ${userId}: ${error.message}`,
        );
      }
    }

    if (pinnedUpdates.length > 0) {
      await this.userService.addPinnedMessage(pinnedUpdates);
    }
  }

  async sentMessageToUser(message: string, userId: number) {
    try {
      return await this.bot.telegram.sendMessage(userId, message);
    } catch (e) {
      console.error('Error in sentMessageToUser', e);
    }
  }

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

    const message = ctx.message as Message.TextMessage;
    this.logger.log(
      `💬 Text message from user ${ctx.from.id}: "${message.text}"`,
    );

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    if (this.promoCodeSet.has(BigInt(ctx.from.id))) {
      this.logger.log(
        `🎟️ Processing promo code for user ${ctx.from.id}: ${message.text}`,
      );
      this.promoCodeSet.delete(BigInt(ctx.from.id));

      try {
        await this.promoCodeService.checkPromoCode(message.text, user.id);
        this.logger.log(`✅ Promo code valid for user ${ctx.from.id}`);
      } catch (e) {
        this.logger.warn(
          `⚠️ Invalid promo code for user ${ctx.from.id}: ${e.message}`,
        );
        await this.sentLocalizedSupportMessage(ctx, e.message);
        return;
      }

      const { type, count } = await this.promoCodeService.activatePromoCode(
        message.text,
        user.id,
      );

      this.logger.log(
        `🎉 Promo code activated for user ${ctx.from.id} - Type: ${type}, Count: ${count}`,
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
    } else {
      this.logger.log(
        `❓ Unknown command from user ${ctx.from.id}: "${message.text}"`,
      );
      await this.sentLocalizedSupportMessage(ctx, 'unknown_command');
    }
  }

  async sendMessageToAdmin(message: string) {
    this.logger.log(
      `📢 Sending message to admins: ${message.substring(0, 100)}...`,
    );
    const admins = process.env.ADMIN_CHAT_ID?.split(',') || [];
    this.logger.log(
      `👥 Found ${admins.length} admin(s): [${admins.join(', ')}]`,
    );

    admins.forEach(async (admin) => {
      try {
        await this.bot.telegram.sendMessage(Number(admin), message);
        this.logger.log(`✅ Message sent to admin ${admin}`);
      } catch (e) {
        this.logger.error(`❌ Error sending message to admin ${admin}:`, e);
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

  private async sendPaginatedVialSelection(
    ctx: Context,
    user: User,
    retouchId: string,
    categoryId?: number,
    page: number = 1,
    perPage: number = 7,
  ) {
    if (!ctx.from?.id) return;

    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const selectedVials = await this.userService.getSelectedVialsId(user.id);
    const allVials = categoryId
      ? await this.vialsService.getVialsByCategory(categoryId)
      : await this.vialsService.getAll();

    const paginatedVials = allVials.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(allVials.length / perPage);

    const keyboard = paginatedVials.map((vial) => {
      const isSelected = selectedVials.includes(vial.id);
      const isDisabled = !isSelected && selectedVials.length >= 2;
      return [
        Markup.button.callback(
          `${isSelected ? '✅' : isDisabled ? '❌' : '➕'} ${vial.name}`,
          `choiceVial_${vial.id}_${retouchId}_${categoryId || ''}_${page}`,
        ),
      ];
    });
    if (paginatedVials.length === 0) {
      keyboard.push([
        Markup.button.callback(
          await this.getLocalizedSupportMessage(
            user.language,
            'no_vials_in_category',
          ),
          `no_vials_${retouchId}_${categoryId || ''}`,
        ),
      ]);
    }

    // Добавляем навигационные кнопки
    const navigationButtons: any[] = [];

    if (page > 1) {
      navigationButtons.push(
        Markup.button.callback(
          await this.getLocalizedSupportMessage(user.language, 'previous_page'),
          `paginateVials_${retouchId}_${categoryId}_${page - 1}`,
        ),
      );
    }

    if (totalPages > 1) {
      navigationButtons.push(
        Markup.button.callback(`${page}/${totalPages}`, 'current_page', true),
      );
    }

    if (page * perPage < allVials.length) {
      navigationButtons.push(
        Markup.button.callback(
          await this.getLocalizedSupportMessage(user.language, 'next_page'),
          `paginateVials_${retouchId}_${categoryId}_${page + 1}`,
        ),
      );
    }

    if (navigationButtons.length > 0) {
      keyboard.push(navigationButtons);
    }

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

    // Добавляем кнопку "Назад к категориям" если выбрана категория
    if (categoryId) {
      keyboard.push([
        Markup.button.callback(
          await this.getLocalizedSupportMessage(
            user.language,
            'back_to_categories',
          ),
          `backToCategories_${retouchId}`,
        ),
      ]);
    }

    const sendMessage = await ctx.reply(
      await this.getLocalizedSupportMessage(
        user.language,
        'choose_vials',
        new Map([
          ['selected', selectedVials.length.toString()],
          ['max', '2'],
        ]),
      ),
      {
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
      },
    );

    if (sendMessage.message_id !== undefined)
      this.vialSelectionMessageId.set(user.id, sendMessage.message_id);
  }

  @Action(/paginateVials_.+/)
  async paginateVials(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    try {
      ctx.deleteMessage();
    } catch (error) {
      Logger.warn('Error deleting message in v:', error.message || error);
    }
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;

    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const [_, retouchId, categoryId, page] = callbackQuery.data.split('_');

    // Удаляем сообщение об ошибке, если оно есть
    await this.deleteVialErrorMessage(ctx, user.id);

    await this.sendPaginatedVialSelection(
      ctx,
      user,
      retouchId,
      categoryId ? +categoryId : undefined,
      +page,
    );
  }

  @Action(/choiceVialCategory_.+/)
  async handleCategorySelection(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    try {
      ctx.deleteMessage();
    } catch (error) {
      Logger.warn(
        'Error deleting message in choiceVialCategory:',
        error.message || error,
      );
    }
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;

    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const [_, retouchId, categoryId] = callbackQuery.data.split('_');

    if (!categoryId) {
      console.error(
        'Category ID is missing in callback data:',
        callbackQuery.data,
      );
      await ctx.answerCbQuery('Category ID is missing');
      return;
    }

    await ctx.answerCbQuery();

    const vials = await this.vialsService.getVialsByCategory(+categoryId);

    // Удаляем сообщение об ошибке, если оно есть
    await this.deleteVialErrorMessage(ctx, user.id);

    try {
      const oldMessageId = this.categorySelectionMessageId.get(user.id);
      if (oldMessageId) await ctx.deleteMessage(oldMessageId);
    } catch (e) {
      console.error('Error deleting previous category selection message:', e);
    }

    await this.sendPaginatedVialSelection(ctx, user, retouchId, +categoryId, 1);
  }

  @Action(/choiceVial_.+/)
  async handleVialSelection(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;

    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const [_, vialId, retouchId, categoryId, page] =
      callbackQuery.data.split('_');

    this.logger.log(
      `🧪 Vial selection action - User: ${user.id}, VialId: ${vialId}, RetouchId: ${retouchId}`,
    );

    if (!vialId) {
      this.logger.error(
        `❌ Vial ID missing in callback data: ${callbackQuery.data}`,
      );
      await ctx.answerCbQuery('Vial ID is missing');
      return;
    }

    // Переключаем состояние выбора флакона
    const selectedVials = await this.userService.getSelectedVialsId(user.id);
    const isSelected = selectedVials.includes(+vialId);

    this.logger.log(
      `📊 User ${user.id} vial state - Selected vials: [${selectedVials.join(',')}], Current vial ${vialId} is ${isSelected ? 'selected' : 'not selected'}`,
    );

    if (isSelected) {
      // Убираем флакон из выбранных
      await this.userService.removeSelectedVial(user.id, +vialId);
      this.logger.log(`➖ Removed vial ${vialId} for user ${user.id}`);
      const removedMessage = await this.getLocalizedSupportMessage(
        user.language,
        'vial_removed',
      );
      await ctx.answerCbQuery(removedMessage);
    } else {
      // Проверяем, не превышает ли выбор максимум 2 флакона
      if (selectedVials.length >= 2) {
        this.logger.warn(
          `⚠️ User ${user.id} tried to select more than 2 vials (current: ${selectedVials.length})`,
        );
        const errorMessage = await this.getLocalizedSupportMessage(
          user.language,
          'max_vials_selected',
        );
        await ctx.answerCbQuery(errorMessage);

        // Отправляем сообщение об ошибке, если его еще нет
        if (!this.vialErrorMessageId.has(user.id)) {
          try {
            const errorMessageFull = await this.getLocalizedSupportMessage(
              user.language,
              'max_vials_selected_message',
            );
            const sentMessage = await ctx.reply(errorMessageFull);
            this.vialErrorMessageId.set(user.id, sentMessage.message_id);
            this.logger.log(
              `💬 Sent max vials error message to user ${user.id}, messageId: ${sentMessage.message_id}`,
            );
          } catch (e) {
            this.logger.error(
              `❌ Error sending vial error message to user ${user.id}:`,
              e,
            );
          }
        }
        return;
      }
      // Добавляем флакон в выбранные
      await this.userService.addSelectedVial(user.id, +vialId);
      this.logger.log(`➕ Added vial ${vialId} for user ${user.id}`);
      const successMessage = await this.getLocalizedSupportMessage(
        user.language,
        'vial_added',
      );
      await ctx.answerCbQuery(successMessage);
    }

    // Удаляем сообщение об ошибке, если оно есть
    await this.deleteVialErrorMessage(ctx, user.id);

    // Обновляем сообщение с актуальным состоянием
    try {
      const oldMessageId = this.vialSelectionMessageId.get(user.id);
      if (oldMessageId) {
        await ctx.deleteMessage(oldMessageId);
      }
    } catch (e) {
      console.error('Error deleting previous vial selection message:', e);
    }

    // Отправляем обновленное сообщение с сохранением текущей категории и страницы
    await this.sendPaginatedVialSelection(
      ctx,
      user,
      retouchId,
      categoryId ? +categoryId : undefined,
      page ? +page : 1,
    );
  }

  @Action(/backToCategories_.+/)
  async backToCategories(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    try {
      ctx.deleteMessage();
    } catch (error) {
      Logger.warn(
        'Error deleting message in backToCategories:',
        error.message || error,
      );
    }
    this.userService.updateUserLastActiveDate(BigInt(ctx.from.id));

    const user = await this.userService.getUserByTelegramId(
      BigInt(ctx.from.id),
    );
    if (!user) return;

    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const [_, retouchId] = callbackQuery.data.split('_');

    // Удаляем сообщение об ошибке, если оно есть
    await this.deleteVialErrorMessage(ctx, user.id);

    await this.sendPaginatedCategorySelection(ctx, user, retouchId);
  }

  /**
   * Удаляет сообщение об ошибке превышения лимита флаконов для пользователя
   */
  private async deleteVialErrorMessage(ctx: Context, userId: number) {
    const errorMessageId = this.vialErrorMessageId.get(userId);
    if (errorMessageId) {
      this.logger.log(
        `🗑️ Deleting vial error message for user ${userId}, messageId: ${errorMessageId}`,
      );
      try {
        await ctx.deleteMessage(errorMessageId);
        this.vialErrorMessageId.delete(userId);
        this.logger.log(
          `✅ Successfully deleted vial error message for user ${userId}`,
        );
      } catch (e) {
        this.logger.warn(
          `⚠️ Error deleting vial error message for user ${userId}:`,
          e,
        );
      }
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
