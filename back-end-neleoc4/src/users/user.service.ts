import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LanguageEnum, User } from '@prisma/client';
import { console } from 'inspector/promises';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        telegramId: data.telegramId,
        telegramFullName: data.fullName,
        telegramUsername: data.username,
      },
    });

    const baseSettings = await this.prisma.baseSettings.findUnique({
      where: { id: 2 },
    });
    if (!baseSettings) {
      await this.prisma.usersSettings.create({
        data: {
          userId: user.id,
          settingsId: 2,
        },
      });
    }

    return user;
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getSelectedVialsId(id: number): Promise<number[]> {
    const data = await this.prisma.userSelectedVials.findMany({
      where: { userId: id },
      select: { vialId: true },
    });
    return data.map((vial) => vial.vialId);
  }

  async addPinnedMessage(
    userMessageMap: { userId: bigint; messageId: number }[],
  ): Promise<void> {
    await Promise.allSettled(
      userMessageMap.map(({ userId, messageId }) =>
        this.prisma.user.update({
          where: { telegramId: Number(userId) },
          data: {
            pinnedMessages: {
              set: [messageId],
            },
          },
        }),
      ),
    );
  }

  async addSelectedVial(userId: number, vialId: number) {
    const existingVial = await this.prisma.userSelectedVials.findUnique({
      where: {
        userId_vialId: {
          userId: userId,
          vialId: vialId,
        },
      },
    });

    if (existingVial) {
      // Если такая связь уже существует, можно вернуть сообщение или просто ничего не делать
      console.log('Этот флакон уже выбран');
      return;
    }
    return this.prisma.userSelectedVials.create({
      data: { userId, vialId },
    });
  }

  async removeSelectedVial(userId: number, vialId: number) {
    return this.prisma.userSelectedVials.delete({
      where: {
        userId_vialId: {
          userId,
          vialId,
        },
      },
    });
  }

  async getUserByTelegramId(telegramId: bigint): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async userIsExistsById(id: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return !!user;
  }

  async userIsExistsByTelegramId(telegramId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    return !!user;
  }

  async getUserMoreInfo(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        generations: true,
        payments: true,
        usersUsePromocodes: true,
        usersSettings: true,
        selectedVials: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return JSON.parse(
      JSON.stringify(user, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  async getUserInfo(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    return JSON.parse(
      JSON.stringify(user, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  async updateLanguage(id: number, language: LanguageEnum) {
    return this.prisma.user.update({
      where: { id },
      data: { language },
    });
  }

  async updateUser(data: UpdateUserDto) {
    await this.getUserById(data.id);

    const user = await this.prisma.user.update({
      where: { id: data.id },
      data: {
        freeGenerationCount: data.free || undefined,
        paymentGenerationCount: data.paid || undefined,
      },
    });
    return user;
  }

  async deleteUser(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }

  async getAllUsers(params: {
    searchQuery?: string;
    searchCriteria?: string;
    sortKey?: string;
    sortDirection?: string;
    page?: number;
    perPage?: number;
  }): Promise<{
    users: User[];
    totalUsers: number;
    pageCount: number;
  }> {
    const {
      searchQuery,
      searchCriteria,
      sortKey,
      sortDirection,
      page,
      perPage,
    } = params;

    const whereClause: any = {};

    console.log('searchQuery', searchQuery);
    if (searchQuery && searchCriteria) {
      switch (searchCriteria) {
        case 'id':
          const ids = searchQuery
            .split(',')
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id));
          whereClause.id = { in: ids };
          break;
        case 'telegramId':
          const telegramId = Number(searchQuery);
          if (!isNaN(telegramId)) {
            whereClause.telegramId = telegramId;
          }
          break;
        case 'login':
          console.log('login');
          whereClause.telegramUsername = {
            contains: searchQuery,
            mode: 'insensitive', // Case-insensitive search
          };
          break;
        case 'name':
          whereClause.telegramFullName = {
            contains: searchQuery,
            mode: 'insensitive', // Case-insensitive search
          };
          break;
      }
    }

    const validSortKeys = [
      'id',
      'telegramId',
      'telegramUsername',
      'telegramFullName',
      'createdAt',
      'updatedAt',
    ];
    const orderByClause =
      sortKey && validSortKeys.includes(sortKey)
        ? { [sortKey]: sortDirection === 'desc' ? 'desc' : 'asc' }
        : undefined;
    const skip = page && perPage ? (page - 1) * perPage : undefined;
    const take = perPage || undefined;

    const data = await this.prisma.user.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip,
      take,
    });

    const users = JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    const usersCount = await this.prisma.user.count({ where: whereClause });
    const pageCount = perPage ? Math.ceil(usersCount / perPage) : 1;

    return { users, totalUsers: usersCount, pageCount };
  }

  async getUsersTelegramId(
    userIds?: number[],
  ): Promise<{ telegramId: bigint; pinnedMessages: number[] }[]> {
    if (userIds && userIds.length > 0) {
      return await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { telegramId: true, pinnedMessages: true },
      });
    }
    return await this.prisma.user.findMany({
      select: { telegramId: true, pinnedMessages: true },
    });
  }

  async incrementPaidUserGenerationsCount(userId: number, count: number = 1) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { paymentGenerationCount: { increment: count } },
    });
  }

  async decrementPaidUserGenerationsCount(userId: number, count: number = 1) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { paymentGenerationCount: { decrement: count } },
    });
  }

  async incrementFreeUserGenerationsCount(userId: number, count: number = 1) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { freeGenerationCount: { increment: count } },
    });
  }

  async decrementFreeUserGenerationsCount(userId: number, count: number = 1) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { freeGenerationCount: { decrement: count } },
    });
  }

  @Cron('0 0 0 * * *')
  private async updateAllUserFreeGenerations() {
    await this.prisma.user.updateMany({
      data: { freeGenerationCount: 2 },
    });
  }

  async updateUserLastActiveDate(telegramId: bigint) {
    await this.prisma.user.update({
      where: { telegramId },
      data: { lastActiveAt: new Date() },
    });
  }
}
