import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DiscountDto } from './dto/discount.dto';

@Injectable()
export class DiscountService {
  constructor(readonly prisma: PrismaService) {}

  async updateDiscount(newDiscount: DiscountDto): Promise<number> {
    const discount = this.prisma.discount.update({
      where: {
        id: 1,
      },
      data: {
        discountPercentage: newDiscount.discountPercentage,
      },
    });
    Logger.log(`Updated discount to ${newDiscount.discountPercentage}`);
    return (await discount)?.discountPercentage ?? -1;
  }

  private async createDiscount() {
    return this.prisma.discount.create({
      data: {
        id: 1,
        discountPercentage: 0,
      },
    });
  }

  async getDiscount(): Promise<number> {
    const discount = await this.prisma.discount.findUnique({
      where: {
        id: 1,
      },
    });
    if (!discount) {
      this.createDiscount();
      return 0;
    }
    return discount?.discountPercentage ?? -1;
  }
}
