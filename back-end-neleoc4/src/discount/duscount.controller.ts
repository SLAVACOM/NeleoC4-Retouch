import {
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { DiscountService } from './discount.service';
import { DiscountDto } from './dto/discount.dto';

@Controller('discount')
export class DiscountController {
  constructor(private readonly service: DiscountService) {}

  @Get()
  async getDiscount() {
    Logger.log('GET - /discount\nRequest');
    const response = await this.service.getDiscount();
    return response;
  }

  @Auth('ADMIN')
  @Patch()
  @UsePipes(new ValidationPipe())
  async updateDiscount(@Body() discount: DiscountDto) {
    Logger.log('PATCH - /discount\nRequest\n' + JSON.stringify(discount));
    const response = await this.service.updateDiscount(discount);
    return response;
  }
}
