import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { BaseSettings, Settings } from '@prisma/client';
import { ApiSettingsService } from './api-settings.service';
import { ApiSettingDto } from './dto/api-settings.dto';

@Controller('settings')
export class ApiSettingsController {
  constructor(private readonly apiSettingsService: ApiSettingsService) {}

  @Get()
  async getAllSettings() {
    return this.apiSettingsService.getAllSettings();
  }

  @Get(':id')
  async getSettingById(@Param('id') id: number): Promise<JSON> {
    return this.apiSettingsService.getSettingsById(+id);
  }

  @Post()
  async createSetting(@Body() settingDto: ApiSettingDto): Promise<Settings> {
    return this.apiSettingsService.addSettings(settingDto);
  }

  @Put(':id')
  async updateSetting(
    @Param('id') id: number,
    @Body() settingDto: ApiSettingDto,
  ): Promise<Settings> {
    return this.apiSettingsService.updateSettings(+id, settingDto);
  }

  @Put('base/:id')
  async updateBaseSetting(
    @Param('id') id: number,
    @Body() settingDto: BaseSettings,
  ): Promise<BaseSettings> {
    return this.apiSettingsService.updateBaseSettings(+id, settingDto);
  }
}
