import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Workers } from '@prisma/client';
import { hash, verify } from 'argon2';
import { PrismaService } from 'src/prisma.service';
import { IWorker } from './dto/addRoles.dto';
import { AuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: AuthDto) {
    const user = await this.validateUser(dto);
    const tokens = await this.issueTokens(user.id);
    return { ...tokens, user };
  }

  async getAll(params: {
    searchQuery?: string;
    searchCriteria?: string;
    sortKey?: string;
    sortDirection?: string;
    page?: number;
    perPage?: number;
    status?: string;
  }): Promise<{
    workers: Omit<Workers, 'password'>[];
    userCount: number;
    pageCount: number;
  }> {
    const {
      searchQuery,
      searchCriteria,
      sortKey,
      sortDirection,
      page,
      perPage,
      status,
    } = params;

    const whereClause: any = {};

    if (searchQuery) {
      if (searchCriteria === 'id') {
        const ids = searchQuery
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
        whereClause.id = {
          in: ids,
        };
      } else {
        whereClause[searchCriteria || 'login'] = {
          contains: searchQuery,
        };
      }
    }

    if (status) {
      if (status === 'active') whereClause.isDelete = false;
      else if (status === 'inactive') whereClause.isDelete = true; 
    }
    const orderByClause = sortKey
      ? {
          [sortKey]: sortDirection || 'asc',
        }
      : {};

    const users = await this.prisma.workers.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip: ((page ?? 1) - 1) * (perPage || 0),
      take: perPage || 0,
    });

    const userCount = await this.prisma.workers.count({
      where: whereClause,
    });

    const pageCount = Math.ceil(userCount / (perPage || 1));

    return {
      workers: users.map(({ password, ...user }) => user),
      userCount,
      pageCount,
    };
  }

  async getNewTokens(refreshToken: string) {
    let result;
    try {
      result = await this.jwt.verifyAsync(refreshToken);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.workers.findUnique({
      where: { id: result.id },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');
    const tokens = await this.issueTokens(user.id);
    return tokens;
  }

  async register(getData: Workers) {
    const oldUser = await this.prisma.workers.findUnique({
      where: {
        login: getData.login,
      },
    });
    if (oldUser) {
      throw new BadRequestException(
        'Пользователь с таким login уже зарегистрирован',
      );
    }
    const { id, ...data } = getData;

    data.password = await hash(data.password);

    const worker = await this.prisma.workers.create({ data });

    return worker;
  }

  private async issueTokens(userId: number) {
    const data = { id: userId };

    const accessToken = this.jwt.sign(data, {
      expiresIn: '6h',
    });
    this.jwt.sign(data, {});

    const refreshToken = this.jwt.sign(data, {
      expiresIn: '7D',
    });

    return { accessToken, refreshToken };
  }

  private async validateUser(dto: AuthDto) {
    const user = await this.prisma.workers.findUnique({
      where: {
        login: dto.login,
      },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');

    const isValid = await verify(user.password, dto.password);

    if (!isValid) throw new UnauthorizedException('Неправильный пароль!');

    const { password, ...result } = user;
    return result;
  }

  async update(getData: IWorker) {
    const { id, ...data } = getData;
    const user = await this.prisma.workers.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');
    const loginExists = await this.prisma.workers.findUnique({
      where: { login: data.login },
    });
    if (loginExists && loginExists.id !== id)
      throw new BadRequestException(
        'Пользователь с таким логином уже существует',
      );

    if (data.password) data.password = await hash(data.password);
    return await this.prisma.workers.update({
      where: { id },
      data,
    });
  }
}
