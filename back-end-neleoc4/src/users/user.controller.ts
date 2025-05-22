import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('usersTgIds')
  async getUsersByTelegram() {
    return await this.userService.getUsersTelegramId();
  }

  @Get()
  async getAll(
    @Query('searchQuery') searchQuery: string,
    @Query('searchCriteria') searchCriteria: string,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection') sortDirection: string,
    @Query('page') page: string,
    @Query('perPage') perPage: string,
  ) {
    Logger.log(
      `Fetching users with searchQuery: ${searchQuery}, searchCriteria: ${searchCriteria}, sortKey: ${sortKey}, sortDirection: ${sortDirection}, page: ${page}, perPage: ${perPage}`,
    );
    const users = this.userService.getAllUsers({
      searchQuery,
      searchCriteria,
      sortKey,
      sortDirection,
      page: Number(page),
      perPage: Number(perPage),
    });
    return users;
  }

  @Get(':id')
  async getUserInfo(@Param('id') id: string) {
    Logger.log(`Fetching user with id: ${id}`);
    return this.userService.getUserInfo(+id);
  }

  @Auth(RoleEnum.ADMIN)
  @Get(':id/more')
  async getMoreUserInfo(@Param('id') id: string) {
    Logger.log(`Fetching more info for user with id: ${id}`);
    return this.userService.getUserMoreInfo(+id);
  }

  @Get('telegram/:telegramId')
  async getUserByTelegramId(@Param('telegramId') telegramId: string) {
    return this.userService.getUserByTelegramId(BigInt(telegramId));
  }

  @UsePipes(new ValidationPipe())
  @Post()
  async addUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
