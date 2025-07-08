import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma.service';

export class LocalizationService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getMessage(messageName: string): Promise<string> {
    const cached = await this.cacheManager.get<string>(
      `message:${messageName}`,
    );
    if (cached) return cached;

    const message = await this.prisma.messages.findUnique({
      where: { messageName: messageName },
    });

    if (!message) {
      console.warn(`❌ Сообщение с именем '${messageName}' не найдено`);
      throw new NotFoundException(`Message not found`);
    }

    await this.cacheManager.set(`message:${messageName}`, message.messageText);
    return message.messageText;
  }

  async addMessage(name: string, ru_message = '', en_message = '') {
    await this.prisma.messages.createMany({
      data: [
        {
          messageName: name + '_RU',
          messageText: ru_message,
        },
        {
          messageName: name + '_EN',
          messageText: en_message,
        },
      ],
    });
    await this.cacheManager.del(`message:${name}_RU`);
    await this.cacheManager.del(`message:${name}_EN`);
  }

  async addMessagesFromJson(messages: JSON) {
    let lines = 0;
    const data = Object.entries(messages).map(([key, value]) => {
      lines++;
      if (!key.endsWith('_EN') && !key.endsWith('_RU')) {
        throw new Error(
          `Неверное название сообщения '${key}' (${lines} строка): должно оканчиваться на '_EN' или '_RU'`,
        );
      }
      return {
        messageName: key,
        messageText: value,
      };
    });

    await this.prisma.messages.createMany({
      data,
      skipDuplicates: true,
    });

    await Promise.all(
      data.map((item) => this.cacheManager.del(`message:${item.messageName}`)),
    );
  }

  async loadAllMessages() {
    const cacheKey = `messages:all`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const messages = await this.prisma.messages.findMany({
      orderBy: { messageName: 'desc' },
    });
    await this.cacheManager.set(cacheKey, messages);

    return messages;
  }

  async updateMessage(messageName: string, messageText: string): Promise<void> {
    await this.getMessage(messageName);

    if (messageText.trim() === '')
      throw new Error(`Сообщение не может быть пустым`);

    await this.getMessage(messageName);

    await this.prisma.messages.update({
      where: { messageName },
      data: { messageText },
    });

    await this.cacheManager.del('messages:all');
    await this.cacheManager.set(`message:${messageName}`, messageText);
  }

  async updateMessagesRuAndEn(
    messagesName: string,
    messageRu: string,
    messageEn: string,
  ): Promise<void> {
    let messagesNames: string[] = [];
    if (messagesName.endsWith('_RU') || messagesName.endsWith('_EN'))
      messagesNames = [`${messagesName}_RU`, `${messagesName}_EN`];

    const messages = await this.prisma.messages.findMany({
      where: { messageName: { in: messagesNames } },
    });

    if (messages.length !== 2) {
      throw new NotFoundException(
        `Сообщения с именами '${messagesNames.join("', '")}' не найдены`,
      );
    }

    await this.prisma.messages.update({
      where: { messageName: messagesNames[0] },
      data: { messageText: messageRu },
    });

    await this.prisma.messages.update({
      where: { messageName: messagesNames[1] },
      data: { messageText: messageEn },
    });

    await this.cacheManager.del(`message:${messagesNames[0]}`);
    await this.cacheManager.del(`message:${messagesNames[1]}`);
  }
}
