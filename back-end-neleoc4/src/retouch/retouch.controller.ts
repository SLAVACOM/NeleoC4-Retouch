import {
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RetouchService } from './retouch.service';

@Controller('generation')
export class FreeGenerationController {
  constructor(private readonly service: RetouchService) {}

  // @Auth('ADMIN')
  @Get('/free')
  async getCount() {
    Logger.log('GET - /generation/free\nRequest');
    // await this.service.getFreeGenerationsCount();
    // return await this.service.getFreeGenerationsCount();
  }

  // @Auth('ADMIN')
  @Patch()
  @UsePipes(new ValidationPipe())
  async updateDiscount(@Body() count: number) {
    Logger.log('Patch - /generation/free\nRequest');
    // return await this.service.setFreeGenerationsCount(count);
  }
}
