import { Injectable } from '@nestjs/common';
import { UsersUsePromocodes } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsedPromoCodeService {
  constructor(private prisma: PrismaService) {}

  async getAllUsedPromoCodes(): Promise<UsersUsePromocodes[]> {
    return this.prisma.usersUsePromocodes.findMany();
  }

  async getUsedPromoCodeById(
    userId: number,
    promoCodeId: number,
  ): Promise<Boolean> {
    const used = await this.prisma.usersUsePromocodes.findFirst({
      where: {
        userId,
        promoCodeId,
      },
    });
    if(used) throw new Error('error_promocode_already_used');
    return true;
  }

  async getAllUserUsedPromoCodes(id: number): Promise<UsersUsePromocodes[]> {
    return this.prisma.usersUsePromocodes.findMany({
      where: {
        userId: id,
      },
    });
  }

  async addUsedPromoCode(
    userId: number,
    promoCodeId: number,
  ): Promise<UsersUsePromocodes> {
    return await this.prisma.usersUsePromocodes.create({
      data: {
        User: {
          connect: { id: userId },
        },
        PromoCode: {
          connect: { id: promoCodeId },
        },
      },
    });
  }
}
