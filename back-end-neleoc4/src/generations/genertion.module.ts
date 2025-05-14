import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PromoCodeModule } from 'src/promocodes/promocode.module';
import { SupportService } from 'src/support/support.service';
import { UserService } from 'src/users/user.service';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';

@Module({
  controllers: [GenerationController],
  imports: [PromoCodeModule],
  providers: [PrismaService, GenerationService, UserService, SupportService],
  exports: [GenerationService],
})
export class GenerationModule {}
