import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Vials } from '@prisma/client';
import { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma.service';
import { VialsDto } from './dto/collection.dto';

@Injectable()
export class VialsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getVialsById(id: number): Promise<Vials> {
    const cacheKey = `vials_${id}`;
    const cachedVials = await this.cacheManager.get<Vials>(cacheKey);
    if (cachedVials) return cachedVials;

    const vials = await this.prisma.vials.findUnique({
      where: { id },
    });
    if (!vials) throw new NotFoundException('Vials not found');

    await this.cacheManager.set(cacheKey, vials, 3600);
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
      },
    });
  }

  async getVialsByCollectionId(vialCollectionId: number): Promise<Vials[]> {
    return this.prisma.vials.findMany({
      where: { vialCollectionId },
    });
  }

  async getAll(): Promise<Vials[]> {
    const cacheKey = 'vials_all';
    const cachedVials = await this.cacheManager.get<Vials[]>(cacheKey);
    if (cachedVials) return cachedVials;

    const vials = await this.prisma.vials.findMany();
    await this.cacheManager.set(cacheKey, vials, 3600);
    return vials;
  }

  async updateVials(id: number, data: VialsDto): Promise<Vials> {
    const updatedVials = await this.prisma.vials.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        photoUrl: data.photoUrl ?? undefined,
        vialCollectionId: data.vialCollectionId ?? undefined,
        isDelete: data.isDelete ?? undefined,
      },
    });

    const cacheKey = `vials_${id}`;
    await this.cacheManager.set(cacheKey, updatedVials, 3600);
    return updatedVials;
  }

  async deleteVials(id: number): Promise<Vials> {
    await this.getVialsById(id);
    const deletedVials = await this.prisma.vials.update({
      where: { id },
      data: { isDelete: true },
    });

    const cacheKey = `vials_${id}`;
    await this.cacheManager.del(cacheKey);
    return deletedVials;
  }

  async undeleteVials(id: number): Promise<Vials> {
    await this.getVialsById(id);
    const undeletedVials = await this.prisma.vials.update({
      where: { id },
      data: { isDelete: false },
    });

    const cacheKey = `vials_${id}`;
    await this.cacheManager.set(cacheKey, undeletedVials, 3600);
    return undeletedVials;
  }

  async getVialsByUserId(userId: number): Promise<Vials[]> {
    const userSelectedVials = await this.prisma.userSelectedVials.findMany({
      where: { userId },
      include: { Vials: true },
    });
    return userSelectedVials.map((userSelectedVial) => userSelectedVial.Vials);
  }

  async getAllCategories(): Promise<{ id: number; name: string }[]> {
    return this.prisma.vialsCollection.findMany({
      select: { id: true, name: true },
    });
  }

  async getVialsByCategory(categoryId: number): Promise<Vials[]> {
    if (!categoryId) {
      throw new BadRequestException('Category ID is missing');
    }

    return this.prisma.vials.findMany({
      where: { vialCollectionId: categoryId, isDelete: false },
    });
  }
}
