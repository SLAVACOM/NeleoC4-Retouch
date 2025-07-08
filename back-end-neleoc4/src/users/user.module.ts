import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FreeGenerationController } from './freeGenerationCount.controller';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [CacheModule.register()],
  controllers: [FreeGenerationController, UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
