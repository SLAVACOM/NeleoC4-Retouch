import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [],
  controllers: [SupportController],
  providers: [SupportService, PrismaService],
  exports: [SupportService],
})
export class SupportModule {}
