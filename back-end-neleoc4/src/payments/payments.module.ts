import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserModule } from 'src/users/user.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BotUpdate } from 'src/bot/bot.update'
import { BotModule } from 'src/bot/bot.module'

@Module({
  imports: [UserModule,BotModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
 