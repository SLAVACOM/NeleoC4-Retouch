import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SupportDto } from './support.dto';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  logger = new Logger(SupportController.name);
  constructor(private supportService: SupportService) {}

  @Get(':id')
  async getSupportInfo(@Param('id') id: number) {
    return this.supportService.getById(+id);
  }

  @Get()
  async getAllSupportInfo() {
    return this.supportService.getAll();
  }

  @Put()
  @UsePipes(new ValidationPipe())
  async update(@Body() data: SupportDto) {
    this.logger.log('Update support info', data);
    return this.supportService.update(data);
  }

  @Delete()
  async delete(@Param(':id') id: number) {
    return this.supportService.delete(+id);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() data: SupportDto) {
    this.logger.log('Create support info', data);
    return this.supportService.create(data.info);
  }
}
