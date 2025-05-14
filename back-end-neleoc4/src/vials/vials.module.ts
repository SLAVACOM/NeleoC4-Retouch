import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { VialsCollectionService } from './collection/vials-collection.service';
import { VialsController } from './vials.controller';
import { VialsService } from './vials/vials.service';

@Module({
  controllers: [VialsController],
  providers: [PrismaService, VialsCollectionService, VialsService],
  exports: [],
})
export class VialsCollectionModule {}
