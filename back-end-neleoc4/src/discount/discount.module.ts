import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DiscountService } from './discount.service';
import { DiscountController } from './duscount.controller';
@Module({
  controllers: [DiscountController],
  providers: [DiscountService, PrismaService],
})
export class DiscountModule {}
