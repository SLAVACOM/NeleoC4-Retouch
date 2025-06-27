import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { MessagesController } from './localization.controller';
import { LocalizationService } from './localization.service';
import { CacheModule } from '@nestjs/cache-manager'; 

@Module({
  imports: [CacheModule.register()],
  providers: [LocalizationService, PrismaService],
  controllers: [MessagesController],
})
export class LocalizationModule {}
