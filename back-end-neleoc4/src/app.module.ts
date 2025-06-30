import { Module } from '@nestjs/common';

import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { redisStore } from 'cache-manager-ioredis-yet';
import * as process from 'process';
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
import { SupportModule } from './support/support.module';
import { UserModule } from './users/user.module';
import { VialsCollectionModule as VialsModule } from './vials/vials.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.registerAsync({
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL || 'redis://89.111.131.235:6379';
        console.log('Connecting to Redis at:', redisUrl);

        return {
          store: redisStore, 
          options: {
            url: redisUrl, 
          },
          ttl: 0,
        };
      },
    }),
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
    PaymentsModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
