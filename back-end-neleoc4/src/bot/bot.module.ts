import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ApiSettingsModule } from 'src/api/api-settings.module';
import { DiscountService } from 'src/discount/discount.service';
import { GenerationService } from 'src/generations/generation.service';
import { GenerationModule } from 'src/generations/genertion.module';
import { LocalizationService } from 'src/messages/localization.service';
import { PaymentsService } from 'src/payments/payments.service';
import { PrismaService } from 'src/prisma.service';
import { ProductsService } from 'src/products/products.service';
import { PromoCodeModule } from 'src/promocodes/promocode.module';
import { PromoCodeService } from 'src/promocodes/promocode.service';
import { UsedPromoCodeService } from 'src/promocodes/used-promocode.service';
import { RetouchService } from 'src/retouch/retouch.service';
import { SupportService } from 'src/support/support.service';
import { UserService } from 'src/users/user.service';
import { VialsService } from 'src/vials/vials/vials.service';
import { BotController } from './bot.controller';
import { BotUpdate } from './bot.update';
import { CacheModule } from '@nestjs/cache-manager'; 

@Module({
  imports: [
    ApiSettingsModule,
    PromoCodeModule,
    GenerationModule,
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN || '',
    }),
    CacheModule.register(),
  ],
  controllers: [BotController],
  providers: [
    BotUpdate,
    UserService,
    PromoCodeService,
    SupportService,
    UsedPromoCodeService,
    GenerationService,
    RetouchService,
    PrismaService,
    VialsService,
    LocalizationService,
    PaymentsService,
    ProductsService,
    DiscountService,
  ],
  exports: [BotUpdate],
})
export class BotModule {}
