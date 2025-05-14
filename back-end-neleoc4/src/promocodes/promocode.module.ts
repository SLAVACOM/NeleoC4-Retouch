import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PromoCodeController } from './promocode.controller';
import { PromoCodeService } from './promocode.service';
import { UsedPromoCodeService } from './used-promocode.service';

@Module({
  controllers: [PromoCodeController],
  providers: [PrismaService, PromoCodeService, UsedPromoCodeService],
  exports: [PromoCodeService],
})
export class PromoCodeModule {}
