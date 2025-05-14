import { Body, Controller, Get, Patch, UsePipes, ValidationPipe } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountDto } from './dto/discount.dto';
import { Auth } from 'src/auth/decorators/auth.decorator'

@Controller('discount')
export class DiscountController {
  constructor(private readonly service: DiscountService) {}

  @Get()
  async getDiscount() {
    return this.service.getDiscount();
  }

  @Auth('ADMIN')  
  @Patch()
	@UsePipes(new ValidationPipe())
  async updateDiscount(@Body() discount: DiscountDto) {
    return this.service.updateDiscount(discount);
  }  
}
