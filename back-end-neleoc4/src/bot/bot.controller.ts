import {
  Body,
  Controller,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { SendPhotoDto } from './dto/send-photo.dto';

@Controller('bot')
export class BotController {
  constructor(private readonly bot: BotUpdate) {}

  @Post('sendToUser')
  async sendToUser(@Body() body: { userId: string; message: string }) {
    Logger.log(
      `Sending message to user, ${body.message}, userId: ${body.userId}`,
    );
    return await this.bot.sentMessageToUser(body.message, +body.userId);
  }

  @Post('sendToUsers')
  async sendToUsers(@Body() body: { message: string; usersId: number[] }) {
    Logger.log(
      `Sending message to users, ${body.message}, usersId: ${body.usersId}`,
    );
    return await this.bot.sentMessageToUsers(body.message, body.usersId);
  }

  @Post('test')
  @UsePipes(new ValidationPipe())
  async test(@Body() body: SendPhotoDto) {
    // return await this.bot.sendPhotoToUser(body);
  }
}
