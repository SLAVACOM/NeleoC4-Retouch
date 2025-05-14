import { Injectable, NotFoundException } from '@nestjs/common';
import { BotUpdate } from 'src/bot/bot.update';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly botUpdate: BotUpdate,
  ) {}

  async createPayment(paymentData: any) {
    const generationCount = paymentData.generationCount || 0;

    const res = await this.prisma.payment.create({
      data: {
        promoCode: paymentData.promoCode,
        amount: paymentData.amount,
        generationCount: generationCount,
        user: {
          connect: { id: +paymentData.userId },
        },
        Product: {
          connect: { id: +paymentData.productId },
        },
      },
    });

    await this.prisma.user.update({
      where: { id: +paymentData.userId },
      data: {
        paymentGenerationCount: {
          increment: generationCount,
        },
        discountId: paymentData.promoCode ? null : undefined,
      },
    });

    if (paymentData.promoCode && paymentData.promoCode !== 'null') {
      await this.prisma.promoCode.update({
        where: { code: paymentData.promoCode },
        data: {
          usesLeft: {
            decrement: 1,
          },
        },
      });
    }

    this.botUpdate.confirmPayment(+paymentData.userId, generationCount);

    return res;
  }

  async getPaymentById(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: true,
        Product: true,
      },
    });

    if (!payment)
      throw new NotFoundException(`Payment with id ${id} not found`);

    return payment;
  }

  async getAllPayments({
    searchQuery = '',
    searchCriteria = 'id',
    sortKey = 'createdAt',
    sortDirection = 'desc',
    page = 1,
    perPage = 10,
  }): Promise<returns> {
    const whereClause: any = {};

    if (searchQuery) {
      if (searchCriteria === 'id' || searchCriteria === 'userId') {
        whereClause[searchCriteria] = Number(searchQuery);
      } else throw new Error(`Unsupported searchCriteria: ${searchCriteria}`);
    }

    const payments = await this.prisma.payment.findMany({
      where: whereClause,
      orderBy: { [sortKey]: sortDirection },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        user: true,
        Product: true,
      },
    });

    const totalPayments = await this.prisma.payment.count({
      where: whereClause,
    });

    const paymentsWithBigIntFixed = payments.map((payment) => ({
      ...payment,
      user: {
        ...payment.user,
        telegramId: payment.user.id.toString(),
      },
    }));
    const pagesCount = Math.ceil(totalPayments / (perPage || totalPayments));

    return {
      payments: paymentsWithBigIntFixed,
      totalPayments,
      page,
      pagesCount,
    };
  } 
}

interface returns {
  payments: any[];
  totalPayments: number;
  page: number;
  pagesCount: number;
}
