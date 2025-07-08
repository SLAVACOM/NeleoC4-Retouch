import { Injectable } from '@nestjs/common';
import { GenerationType } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getStatistics(params: { startDate?: string; endDate?: string }) {
    const startDate = params.startDate
      ? new Date(params.startDate)
      : new Date(Date.now() - 7 * 86400000);

    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = params.endDate ? new Date(params.endDate) : new Date();

    endDate.setUTCHours(23, 59, 59, 999);

    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const generations = await this.prisma.generation.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        type: true,
        userId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const allUsers = await this.prisma.user.findMany({
      where: {
        createdAt: {
          lt: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        lastActiveAt: true, // Добавляем поле последней активности если оно есть
      },
    });

    let freeGenerationCountTotal = 0;
    let paidGenerationCountTotal = 0;

    const paymentsByDateMap = new Map<string, number>();

    const freeGenerationsByDateMap = new Map<string, number>();
    const paidGenerationsByDateMap = new Map<string, number>();
    const totalGenerationsByDateMap = new Map<string, number>();

    const activeUniqueUsersByDateMap = new Map<string, Set<number>>();

    payments.forEach((payment) => {
      const dateStr = payment.createdAt.toISOString().split('T')[0];
      const currentAmount = paymentsByDateMap.get(dateStr) || 0;
      paymentsByDateMap.set(dateStr, currentAmount + payment.amount);
    });

    generations.forEach((generation) => {
      const dateStr = generation.createdAt.toISOString().split('T')[0];

      const usersSet =
        activeUniqueUsersByDateMap.get(dateStr) ?? new Set<number>();
      usersSet.add(generation.userId);
      activeUniqueUsersByDateMap.set(dateStr, usersSet);

      if (generation.type === GenerationType.FREE) {
        const currentCount = freeGenerationsByDateMap.get(dateStr) || 0;
        freeGenerationsByDateMap.set(dateStr, currentCount + 1);
        freeGenerationCountTotal++;
      } else if (generation.type === GenerationType.PAID) {
        const currentCount = paidGenerationsByDateMap.get(dateStr) || 0;
        paidGenerationsByDateMap.set(dateStr, currentCount + 1);
        paidGenerationCountTotal++;
      }
      const totalCount = totalGenerationsByDateMap.get(dateStr) || 0;
      totalGenerationsByDateMap.set(dateStr, totalCount + 1);
    });

    const allDays: Array<{
      date: string;
      totalAmount: number;
      freeGenerationCount: number;
      paidGenerationCount: number;
      totalGenerationCount: number;
      uniqueUserCount: number;
      inactiveUserCount: number;
    }> = [];

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const totalAmount = paymentsByDateMap.get(dateStr) || 0;
      const freeGenerationCount = freeGenerationsByDateMap.get(dateStr) || 0;
      const paidGenerationCount = paidGenerationsByDateMap.get(dateStr) || 0;
      const totalGenerationCount = totalGenerationsByDateMap.get(dateStr) || 0;

      const uniqueUserCount =
        activeUniqueUsersByDateMap.get(dateStr)?.size || 0;

      let inactiveUserCount = 0;
      const currentDateEnd = new Date(currentDate);
      currentDateEnd.setUTCHours(23, 59, 59, 999);

      // Получаем множество пользователей, которые делали генерации в этот день
      const activeUsersToday =
        activeUniqueUsersByDateMap.get(dateStr) || new Set<number>();

      allUsers.forEach((user) => {
        // Пользователь должен существовать на эту дату (быть созданным до конца дня)
        if (user.createdAt >= currentDateEnd) return;

        // Если пользователь НЕ делал генерации в этот день - он неактивен
        if (!activeUsersToday.has(user.id)) {
          inactiveUserCount++;
        }
      });

      allDays.push({
        date: dateStr,
        totalAmount,
        freeGenerationCount,
        paidGenerationCount,
        totalGenerationCount,
        uniqueUserCount,
        inactiveUserCount,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const allUniqueUsers = new Set<number>();
    generations.forEach((gen) => {
      if (gen.userId) {
        allUniqueUsers.add(gen.userId);
      }
    });

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      days: allDays,
      totalAmount: allDays.reduce((sum, day) => sum + day.totalAmount, 0),
      totalPayments: payments.length,
      freeGenerationCountTotal: freeGenerationCountTotal,
      paidGenerationCountTotal: paidGenerationCountTotal,
      totalGenerations: generations.length,
      totalUniqueUsers: allUniqueUsers.size,
    };
  }
}
