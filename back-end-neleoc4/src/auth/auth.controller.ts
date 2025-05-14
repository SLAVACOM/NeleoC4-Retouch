import {
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Workers } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: AuthDto) {
    const response =  await this.authService.login(dto);
    return response
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('login/access-token')
  async getNewTokens(@Body() dto: RefreshTokenDto) {
    console.log("UPDATE TOKEN")
    return this.authService.getNewTokens(dto.refreshToken);
  }


  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('register')
  async register(@Body() data: Workers) {
    return this.authService.register(data);
  }
}
