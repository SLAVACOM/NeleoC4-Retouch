import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistic.controller'

@Module({
  controllers: [StatisticsController],
  providers: [StatisticsService, PrismaService],
})
export class StatisticsModule {}
