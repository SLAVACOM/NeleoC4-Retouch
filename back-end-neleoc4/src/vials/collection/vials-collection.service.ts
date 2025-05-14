import { Injectable, NotFoundException } from '@nestjs/common';
import { VialsCollection } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CollectionDto } from './dto/collection.dto';

@Injectable()
export class VialsCollectionService {
  constructor(private readonly prisma: PrismaService) {}

  async getCollectionById(id: number): Promise<VialsCollection> {
    const collection = await this.prisma.vialsCollection.findUnique({
      where: { id },
      include: { Vials: true },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async updateCollection(
    id: number,
    data: CollectionDto,
  ): Promise<VialsCollection> {
    const collection = await this.prisma.vialsCollection.findUnique({
      where: { id },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return this.prisma.vialsCollection.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? '',
      },
    });
  }
  async createNewCollection(data: CollectionDto): Promise<VialsCollection> {
    const collection = await this.prisma.vialsCollection.findUnique({
      where: { name: data.name },
    });
    if (collection) throw new NotFoundException('Collection already exists');
    return this.prisma.vialsCollection.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async getCollections(): Promise<VialsCollection[]> {
    return this.prisma.vialsCollection.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async getCollectionsAndVials(): Promise<VialsCollection[]> {
    return this.prisma.vialsCollection.findMany({
      include: { Vials: true },
      orderBy: { id: 'desc' },
    });
  }
}
