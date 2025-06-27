import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { LocalizationService } from './localization.service';

@Controller('messages/localization')
export class MessagesController {
  constructor(private messagesService: LocalizationService) {}

  @Get()
  async getAllMessages() {
    Logger.log(`GET - /messages/localization Request`);

    const response = await this.messagesService.loadAllMessages();
    Logger.log('\nResponse\n' + JSON.stringify(response));
    return response;
  }

  @Get(':messageName')
  async getMessageByName(
    @Param('messageName') messageName: string,
  ): Promise<string> {
    Logger.log(`GET - /messages/localization/${messageName} Request`);

    const response = await this.messagesService.getMessage(messageName);
    Logger.log(
      `GET - /messages/localization/${messageName} Response\n` +
        JSON.stringify(response),
    );
    return response;
  }

  @Post()
  async addMessage(@Body() { name, ru_message = '', en_message = '' }) {
    Logger.log(
      `POST - /messages/localization Request\nname: ${name}, ru_message: ${ru_message}, en_message: ${en_message}`,
    );

    const response = await this.messagesService.addMessage(
      name,
      ru_message,
      en_message,
    );
    Logger.log(
      'POST - /messages/localization Response\n' + JSON.stringify(response),
    );
    return response;
  }

  @Post('add/fromJson')
  async addMessagesFromJson(@Body() messages: JSON) {
    Logger.log(
      `POST - /messages/localization/add/fromJson Request\nmessages: ${messages}`,
    );

    const response = await this.messagesService.addMessagesFromJson(messages);
    Logger.log(
      'POST - /messages/localization/add/fromJson Response\n' +
        JSON.stringify(response),
    );
    return response;
  }

  @Put()
  async updateMessage(@Body() { name, message = '' }) {
    Logger.log(
      `PUT - /messages/localization Request\nname: ${name}\nmessage: ${message}`,
    );

    const response = await this.messagesService.updateMessage(name, message);
    Logger.log(
      `PUT - /messages/localization Response\n` + JSON.stringify(response),
    );
    return response;
  }
}
