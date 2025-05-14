import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupportInfo } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { SupportDto } from './support.dto';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async create(info: string) {
    return await this.prisma.supportInfo.create({
      data: {
        info,
      },
    });
  }

  async getById(id: number): Promise<SupportInfo> {
    const data = await this.prisma.supportInfo.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('Not Found');
    return data;
  }

  async update(data: SupportDto): Promise<SupportInfo> {
    if (!data.id) throw new BadRequestException('Not Found');
    await this.getById(data.id);
    return await this.prisma.supportInfo.update({
      where: { id: data.id },
      data: { info: data.info },
    });
  }

  async getAll(): Promise<SupportInfo[]> {
    return await this.prisma.supportInfo.findMany();
  }

  async delete(id: number) {
    return await this.prisma.supportInfo.delete({
      where: { id },
    });
  }
}
