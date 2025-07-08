import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/users/user.service';
import { ApiSettingsController } from './api-settings.controller';
import { ApiSettingsService } from './api-settings.service';
import { URLController } from './api.controller';

@Module({
  imports: [CacheModule.register()],

  controllers: [ApiSettingsController, URLController],
  providers: [ApiSettingsService, PrismaService, UserService],
  exports: [ApiSettingsService],
})
export class ApiSettingsModule {}
