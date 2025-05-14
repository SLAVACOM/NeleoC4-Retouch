import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PromoCode } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import {
  PromoCodeDiscountPercentageDto,
  PromoCodeDiscountSumSumDto,
  PromoCodeDto,
  UpdatePromoCodeDto,
} from './dto/promocode.dto';
import { UsedPromoCodeService } from './used-promocode.service';

@Injectable()
export class PromoCodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usedPromocodeSevice: UsedPromoCodeService,
  ) {}

  async checkPromoCode(code: string, userId: number): Promise<boolean> {
    const promo = await this.prisma.promoCode.findFirst({
      where: {
        code,
        isActive: true,
        AND: {
          usesLeft: {
            gt: 0,
          },
          expirationDate: {
            gte: new Date(),
          },
        },
      },
    });

    if (!promo) throw new Error('error_promocode_not_found');

    if (
      !promo.isMultiUse &&
      (await this.isUsedPromoCodeByUserId(promo.id, userId))
    )
      throw new Error('error_promocode_already_used');
    return !!promo;
  }

  async getAllPromoCodes(params: {
    searchQuery?: string;
    searchCriteria?: string;
    sortKey?: string;
    sortDirection?: string;
    page?: number;
    perPage?: number;
    promoType?: string;
  }): Promise<{
    promos: PromoCode[];
    productCount: number;
    pageCount: number;
  }> {
    const whereClause: any = {};

    if (params.searchQuery) {
      if (params.searchCriteria === 'expirationDateGreater') {
        whereClause.expirationDate = {
          gte: new Date(params.searchQuery),
        };
      } else if (params.searchCriteria === 'expirationDateLess') {
        whereClause.expirationDate = {
          lte: new Date(params.searchQuery),
        };
      } else if (params.searchCriteria === 'id') {
        const ids = params.searchQuery
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
        whereClause.id = {
          in: ids,
        };
      } else {
        whereClause[params.searchCriteria || 'code'] = {
          contains: params.searchQuery,
        };
      }
    }

    if (params.promoType) {
      if (params.promoType === 'discountSum') {
        whereClause.isDiscount = true;
        whereClause.isAddGeneration = false;
        whereClause.discountSum = { gt: 0 };
      } else if (params.promoType === 'discountPer') {
        whereClause.isDiscount = true;
        whereClause.isAddGeneration = false;
        whereClause.discountPercentage = { gt: 0 };
      } else if (params.promoType === 'addGen')
        whereClause.isAddGeneration = true;
    }

    const orderByClause = params.sortKey
      ? {
          [params.sortKey]: params.sortDirection || 'asc',
        }
      : {};

    const promos = await this.prisma.promoCode.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip: ((params.page ?? 1) - 1) * (params.perPage || 0),
      take: params.perPage || 0,
    });

    const promosCount = await this.prisma.promoCode.count({
      where: whereClause,
    });

    const pageCount = Math.ceil(promosCount / (params.perPage || promosCount));

    return { promos, productCount: promosCount, pageCount };
  }

  async getPromoCodeDetails(code: string): Promise<PromoCode | null> {
    if (!code) throw new Error('Code is required');
    const promo = await this.prisma.promoCode.findUnique({
      where: {
        code,
      },
    });
    if (!promo) throw new Error('Promo code not found');
    return promo;
  }

  async createPromoCodeSum(
    data: PromoCodeDiscountSumSumDto,
  ): Promise<PromoCode> {
    const promoExist = await this.prisma.promoCode.findUnique({
      where: { code: data.code },
    });
    if (promoExist) throw new Error('Promo code already exists');
    return this.prisma.promoCode.create({
      data: {
        ...data,
        isDiscount: true,
      },
    });
  }

  async createPromoCodePercentage(
    data: PromoCodeDiscountPercentageDto,
  ): Promise<PromoCode> {
    if (!data.discountPercentage)
      throw new Error('Discount percentage is required');
    return this.prisma.promoCode.create({ data });
  }

  async createPromoCode(data: PromoCodeDto): Promise<PromoCode> {
    const { id, ...promoCodeData } = data; // Exclude the id field
    console.log(promoCodeData);
    const promoExist = await this.prisma.promoCode.findUnique({
      where: { code: promoCodeData.code },
    });
    if (promoExist) throw new ConflictException('Promo code already exists');
    return this.prisma.promoCode.create({ data: promoCodeData });
  }

  async deletePromoCode(code: string): Promise<PromoCode> {
    return this.prisma.promoCode.update({
      where: {
        code,
      },
      data: {
        isActive: false,
      },
    });
  }

  async updatePromoCode(
    data: UpdatePromoCodeDto,
    code: string,
  ): Promise<PromoCode> {
    if (!code) throw new Error('Code is required');
    const promo = await this.prisma.promoCode.findUnique({
      where: { code },
    });

    console.log(code, promo);
    if (!promo) throw new NotFoundException('Promo code not found');
    return this.prisma.promoCode.update({
      where: {
        code,
      },
      data,
    });
  }

  async createManyPromoCodes(data: number, discountSum: number): Promise<void> {
    for (let i = 0; i < data; i++) {
      const code = Math.random().toString(36).substring(2, 15);
      await this.prisma.promoCode.create({
        data: {
          code,
          discountSum,
        },
      });
    }
  }

  async activatePromoCode(
    code: string,
    userId: number,
  ): Promise<PromoCodeActivate> {
    const promo = await this.getPromoCodeDetails(code);
    if (!promo) throw new NotFoundException('Promo code not found');

    await this.usedPromocodeSevice.addUsedPromoCode(userId, promo.id);
    let activate: PromoCodeActivate;

    if (promo.isAddGeneration) {
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          paymentGenerationCount: {
            increment: promo.generationCount,
          },
        },
      });
      activate = {
        count: promo.generationCount,
        type: 'generationCount',
      };
    } else {
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          discountId: promo.id,
        },
      });
      if (promo.discountPercentage > 0)
        activate = {
          count: promo.discountPercentage,
          type: 'discountPercentage',
        };
      else
        activate = {
          count: promo.discountSum,
          type: 'discountSum',
        };
    }
    await this.prisma.promoCode.update({
      where: {
        id: promo.id,
      },

      data: {
        usesLeft: { decrement: 1 },
        isActive: promo.usesLeft > 1 ? true : false,
      },
    });

    return activate;
  }

  async isUsedPromoCodeByUserId(
    promoCodeId: number,
    userId: number,
  ): Promise<boolean> {
    const used = await this.prisma.usersUsePromocodes.findFirst({
      where: {
        userId,
        promoCodeId,
      },
    });

    return !!used;
  }

  async getPromoCodeByID(id: number): Promise<PromoCode> {
    const promo = await this.prisma.promoCode.findUnique({
      where: {
        id,
      },
    });
    if (!promo) throw new NotFoundException('Promo code not found');
    return promo;
  }
}

interface PromoCodeActivate {
  type: 'discountSum' | 'discountPercentage' | 'generationCount';
  count: number;
}
