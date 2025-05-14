import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiSett } from '@prisma/client';
import { ApiSettingsService } from './api-settings.service';
import { UrlDto } from './dto/api-settings.dto';

@Controller('settings/api')
export class URLController {
  constructor(private readonly apiSettingsService: ApiSettingsService) {}

  @Get()
  async getAllSettings(): Promise<ApiSett[]> {
    return this.apiSettingsService.getApiUrl();
  }

  @Get(':id')
  async getSettingById(@Param('id') id: number): Promise<ApiSett> {
    return this.apiSettingsService.getApiUrlById(+id);
  }

  @Post()
  async createSetting(@Body() data: UrlDto): Promise<ApiSett> {
    return this.apiSettingsService.addApiUrl(data);
  }

  @Put(':id')
  async updateSetting(
    @Param('id') id: number,
    @Body() data: UrlDto,
  ): Promise<ApiSett> {
    return this.apiSettingsService.updateApiUrl(+id, data);
  }

  @Delete(':id')
  async deleteURlSetting(@Param('id') id: number): Promise<ApiSett> {
    return this.apiSettingsService.deleteApiUrl(+id);
  }
}
