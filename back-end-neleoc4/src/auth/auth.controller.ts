import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Workers } from '@prisma/client';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: AuthDto) {
    Logger.log('Login request', JSON.stringify(dto));
    const response = await this.authService.login(dto);
    Logger.log('Login response', JSON.stringify(response));
    return response;
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('login/access-token')
  async getNewTokens(@Body() dto: RefreshTokenDto) {
    Logger.log('Get new tokens request', JSON.stringify(dto));
    return this.authService.getNewTokens(dto.refreshToken);
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('register')
  async register(@Body() data: Workers) {
    Logger.log('Register request', JSON.stringify(data));
    return this.authService.register(data);
  }
}
