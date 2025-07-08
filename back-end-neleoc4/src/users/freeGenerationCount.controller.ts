import {
  Body,
  Controller,
  Get,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UpdateCountDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@Controller('freeGenerationCount')
export class FreeGenerationController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getCount() {
    return await this.userService.getGenerationPerDayCount();
  }

  @UsePipes(new ValidationPipe())
  @Put()
  async updateCount(@Body() count: UpdateCountDto) {
    return this.userService.updateGenerationPerDayCount(count);
  }
}
