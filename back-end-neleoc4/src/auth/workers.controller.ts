import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Workers } from '@prisma/client';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { IWorker } from './dto/addRoles.dto';

@Controller('workers')
export class WorkersController {
  constructor(private readonly authService: AuthService) {}

  @Auth()
  @Get()
  async get(
    @Query('searchQuery') searchQuery: string,
    @Query('searchCriteria') searchCriteria: string,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection') sortDirection: string,
    @Query('page') page: string,
    @Query('perPage') perPage: string,
    @Query('status') status: string,
  ) {
    Logger.log(
      `Fetching workers with searchQuery: ${searchQuery}, searchCriteria: ${searchCriteria}, sortKey: ${sortKey}, sortDirection: ${sortDirection} page: ${page}, perPage: ${perPage}, status=${status}`,)
    return this.authService.getAll({
      searchQuery,
      searchCriteria,
      sortKey,
      sortDirection,
      page: Number(page),
      perPage: Number(perPage),
      status
    });
  }

  @Auth('ADMIN')
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Put()
  async update(@Body() dto: IWorker) {
    return this.authService.update(dto);
  }

  @Auth('ADMIN')
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('register')
  async register(@Body() dto: Workers) {
    return this.authService.register(dto);
  }
}
