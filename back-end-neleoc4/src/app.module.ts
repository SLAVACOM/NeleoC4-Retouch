import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiSettingsModule } from './api/api-settings.module';
import { AuthModule } from './auth/auth.module';
import { BotModule } from './bot/bot.module';
import { DiscountModule } from './discount/discount.module';
import { GenerationModule } from './generations/genertion.module';
import { LocalizationModule } from './messages/localization.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaService } from './prisma.service';
import { ProductsModule } from './products/products.module';
import { PromoCodeModule } from './promocodes/promocode.module';
import { RetouchModule } from './retouch/retouch.module';
import { UserModule } from './users/user.module';
import { VialsCollectionModule as VialsModule } from './vials/vials.module';
import { SupportModule } from './support/support.module'


@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    UserModule,
    PaymentsModule,
    ApiSettingsModule,
    RetouchModule,
    DiscountModule,
    ProductsModule,
    PromoCodeModule,
    GenerationModule,
    BotModule,
    SupportModule,
    ScheduleModule.forRoot(),
    VialsModule,
    LocalizationModule,
    PaymentsModule
  ],
  providers: [PrismaService],
})
export class AppModule {}
