import { Injectable, NotFoundException } from '@nestjs/common';
import { Generation } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserService } from './../users/user.service';
import { GenerationDto } from './dto/generation.dto';

@Injectable()
export class GenerationService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  async getGenerationById(id: number): Promise<Generation> {
    const generation = await this.prisma.generation.findUnique({
      where: { id },
    });
    if (!generation) throw new NotFoundException('Generation not found');
    return generation;
  }

  async getGenerations(): Promise<Generation[]> {
    return this.prisma.generation.findMany();
  }

  async addGeneration(data: GenerationDto): Promise<Generation> {
    if (data.type === 'FREE')
      this.userService.decrementFreeUserGenerationsCount(data.userId);
    else this.userService.decrementPaidUserGenerationsCount(data.userId);

    return this.prisma.generation.create({
      data: {
        user: {
          connect: { id: data.userId },
        },
        retouchId: data.retouchId,
        type: data.type,
      },
    });
  }
}
