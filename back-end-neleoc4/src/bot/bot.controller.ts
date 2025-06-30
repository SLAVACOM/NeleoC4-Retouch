import {
  Body,
  Controller,
  Logger,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BotUpdate } from './bot.update';

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
  @UseInterceptors(FilesInterceptor('photo'))
  async sendToUsers(
    @UploadedFiles() photos: Express.Multer.File[],
    @Body('message') message: string,
    @Body('usersId') usersId: number[],
    @Body('pinned') pinned: boolean = false,
  ) {
    Logger.log(`Sending message to users, ${message}, usersId: ${usersId}, pinned: ${pinned}, photos: ${photos.length}`);
    return await this.bot.sentMessageToUsers(message, usersId, photos, pinned);
  }
}
