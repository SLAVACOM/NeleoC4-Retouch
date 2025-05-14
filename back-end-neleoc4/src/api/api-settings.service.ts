import { Injectable } from '@nestjs/common';
import { ApiSett, BaseSettings, Settings, UsersSettings } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/users/user.service';
import { ApiSettingDto, UrlDto } from './dto/api-settings.dto';

@Injectable()
export class ApiSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async changeUserSettings(userId: number, settingsId: number): Promise<void> {
    await this.userService.getUserById(userId);
    await this.prisma.usersSettings.update({
      where: { userId },
      data: {
        settingsId,
      },
    });
  }

  async initBaseSettings(): Promise<BaseSettings[]> {
    let setting = await this.prisma.settings.findMany()[0];
    const baseSettings = await this.prisma.baseSettings.findMany();
    if (!setting) {
      setting = await this.prisma.settings.create({
        data: {
          settings: '{}',
        },
      });
    }

    if (baseSettings.length === 0) {
      await this.prisma.baseSettings.create({
        data: {
          id: 1,
          name: 'light',
          settingsId: setting.id,
        },
      });
      await this.prisma.baseSettings.create({
        data: {
          id: 2,
          name: 'medium',
          settingsId: setting.id,
        },
      });
      await this.prisma.baseSettings.create({
        data: {
          id: 3,
          name: 'hard',
          settingsId: setting.id,
        },
      });

      return this.prisma.baseSettings.findMany();
    }
    return baseSettings;
  }

  async addSettings(data: ApiSettingDto): Promise<Settings> {
    return this.prisma.settings.create({
      data: {
        settings: data.settings,
      },
    });
  }

  async updateSettings(id, data: ApiSettingDto): Promise<Settings> {
    return this.prisma.settings.update({
      where: { id },
      data: {
        settings: data.settings,
      },
    });
  }

  async updateBaseSettings(id, data: BaseSettings): Promise<BaseSettings> {
    const setting = await this.prisma.baseSettings.findUnique({
      where: { id: data.id },
    });
    if (!setting) throw new Error('Settings not found');
    return this.prisma.baseSettings.update({
      where: { id },
      data: {
        name: data.name ?? setting.name,
        settingsId: data.settingsId ?? setting.settingsId,
      },
    });
  }

  async getSettingsById(id: number): Promise<JSON> {
    const settings = await this.prisma.settings.findUnique({
      where: { id },
    });
    if (!settings) throw new Error('Settings not found');
    try {
      console.log(settings);
      const res = JSON.parse(settings.settings);
      return res;
    } catch (e) {
      throw new Error('Settings no valid JSON');
    }
  }

  async getAllSettings() {
    const settings = await this.prisma.settings.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        settings: true,
      },
    });

    const baseSettings = await this.prisma.baseSettings.findMany({
      orderBy: { id: 'desc' },
      include: { settings: true },
    });

    const response = {
      settings: settings.map((setting) => ({
        id: setting.id,
        settings: setting.settings,
      })),
      baseSettings:
        baseSettings.length !== 0
          ? baseSettings
          : await this.initBaseSettings(),
    };
    return response;
  }

  async getUserSettings(userId: number): Promise<number> {
    await this.userService.getUserById(userId);

    let userSettings = await this.prisma.usersSettings.findUnique({
      where: { userId },
    });
    if (!userSettings) userSettings = await this.initNewUserSettings(userId);

    const baseSetting = await this.prisma.baseSettings.findUniqueOrThrow({
      where: { id: userSettings.settingsId },
    });

    const resultSetting = await this.prisma.settings.findUnique({
      where: { id: baseSetting.settingsId },
    });
    if (!resultSetting) throw new Error('Settings not found');
    return resultSetting.id;
  }

  async getDefaultSettings(): Promise<number> {
    const settings = await this.prisma.baseSettings.findFirst({
      where: { id: 2 },
    });
    if (!settings) throw new Error('Default settings not found');
    return settings.settingsId;
  }

  async initNewUserSettings(userId: number): Promise<UsersSettings> {
    const defaultSettings = await this.prisma.baseSettings.findFirst({
      where: { id: 2 },
    });

    if (!defaultSettings) throw new Error('Default settings not found');
    return await this.prisma.usersSettings.create({
      data: {
        settingsId: defaultSettings?.settingsId,
        userId,
      },
    });
  }

  async getApiUrl(): Promise<ApiSett[]> {
    const data = await this.prisma.apiSett.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return data;
  }

  async getApiUrlByName(name: string): Promise<ApiSett> {
    const data = await this.prisma.apiSett.findUnique({
      where: { name },
    });
    if (!data) throw new Error('API URL not found');
    return data;
  }

  async getApiUrlById(id: number): Promise<ApiSett> {
    const data = await this.prisma.apiSett.findUnique({
      where: { id },
    });
    if (!data) throw new Error('API URL not found');
    return data;
  }

  async addApiUrl(data: UrlDto): Promise<ApiSett> {
    const apiUrl = await this.prisma.apiSett.create({
      data: {
        data: data.data,
        name: data.name,
      },
    });
    return apiUrl;
  }

  async updateApiUrl(id: number, data: UrlDto): Promise<ApiSett> {
    await this.getApiUrlById(id);

    return this.prisma.apiSett.update({
      where: { id },
      data,
    });
  }

  async deleteApiUrl(id: number): Promise<ApiSett> {
    return this.prisma.apiSett.delete({
      where: { id },
    });
  }
}
