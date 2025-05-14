import { Module } from '@nestjs/common';
import { ApiSettingsService } from 'src/api/api-settings.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/users/user.service';
import { RetouchService } from './retouch.service';

@Module({
  providers: [RetouchService, PrismaService, UserService, ApiSettingsService],
  exports: [RetouchModule],
})
export class RetouchModule {}
