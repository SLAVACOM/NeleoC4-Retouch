import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Vials } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { VialsDto } from './dto/collection.dto';

@Injectable()
export class VialsService {
  constructor(private readonly prisma: PrismaService) {}

  async getVialsById(id: number): Promise<Vials> {
    const vials = await this.prisma.vials.findUnique({
      where: { id },
    });
    if (!vials) throw new NotFoundException('Vials not found');
    return vials;
  }

  async getVialsURLByUser(userId: number): Promise<string[]> {
    const userSelectedVials = await this.prisma.userSelectedVials.findMany({
      where: { userId },
      include: { Vials: true },
    });
    if (!userSelectedVials) throw new NotFoundException('Vials not found');
    return userSelectedVials.map(
      (userSelectedVial) => userSelectedVial.Vials.photoUrl,
    );
  }

  async createNewVial(data: VialsDto): Promise<Vials> {
    const vial = await this.prisma.vials.findUnique({
      where: { name: data.name },
    });
    if (vial) throw new BadRequestException('Vial already exists');
    return this.prisma.vials.create({
      data: {
        name: data.name,
        photoUrl: data.photoUrl,
        vialCollectionId: data.vialCollectionId,
        isDelete: data.isDelete ?? false,
      }
    });
  }

  async getVialsByCollectionId(vialCollectionId: number): Promise<Vials[]> {
    return this.prisma.vials.findMany({
      where: { vialCollectionId },
    });
  }

  async getAll(): Promise<Vials[]> {
    return this.prisma.vials.findMany();
  }

  async updateVials(id: number, data: VialsDto): Promise<Vials> {
    return this.prisma.vials.update({
      where: { id },
      data:{
        name: data.name ?? undefined,
        photoUrl: data.photoUrl?? undefined,
        vialCollectionId: data.vialCollectionId?? undefined,
        isDelete: data.isDelete?? undefined,
      },
    });
  }

  async deleteVials(id: number): Promise<Vials> {
    await this.getVialsById(id);
    return this.prisma.vials.update({
      where: { id },
      data: { isDelete: true },
    });
  }

  async undeleteVials(id: number): Promise<Vials> {
    await this.getVialsById(id);
    return this.prisma.vials.update({
      where: { id },
      data: { isDelete: false },
    });
  }

  async getVialsByUserId(userId: number): Promise<Vials[]> {
    const userSelectedVials = await this.prisma.userSelectedVials.findMany({
      where: { userId },
      include: { Vials: true },
    });
    return userSelectedVials.map((userSelectedVial) => userSelectedVial.Vials);
  }
}
