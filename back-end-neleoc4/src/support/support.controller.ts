import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SupportDto } from './support.dto';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Get(':id')
  async getSupportInfo(@Param('id') id: number) {
    return this.supportService.getById(+id);
  }
  @Get()
  async getAllSupportInfo() {
    return this.supportService.getAll();
  }

  @Patch()
  @UsePipes(new ValidationPipe())
  async update(@Body() data: SupportDto) {
    return this.supportService.update(data);
  }

  @Delete()
  async delete(@Param(':id') id: number) {
    return this.supportService.delete(+id);
  }
}
