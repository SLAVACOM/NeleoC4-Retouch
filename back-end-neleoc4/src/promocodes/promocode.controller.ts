import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PromoCode } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { PromoCodeDto, UpdatePromoCodeDto } from './dto/promocode.dto';
import { PromoCodeService } from './promocode.service';

@Controller('promocodes')
export class PromoCodeController {
  private readonly logger = new Logger(PromoCodeController.name);

  constructor(private promoCodeService: PromoCodeService) {}

  @Auth('VIALS_MANAGER')
  @Get()
  async getAllPromoCodes(
    @Query('searchQuery') searchQuery: string,
    @Query('searchCriteria') searchCriteria: string,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection') sortDirection: string,
    @Query('page') page: string,
    @Query('perPage') perPage: string,
    @Query('promoType') promoType: string,
  ) {
    this.logger.log(
      `Fetching promo codes with   sortKey: ${sortKey}, sortDirection: ${sortDirection} page: ${page}, perPage: ${perPage}, promoType: ${promoType}`,
    );

    return this.promoCodeService.getAllPromoCodes({
      searchQuery,
      searchCriteria,
      sortKey,
      sortDirection,
      page: Number(page),
      perPage: Number(perPage),
      promoType,
    });
  }

  @Get('check/:code')
  async checkPromoCode(code: string): Promise<boolean> {
    return true;
    //pageCount return this.promoCodeService.checkPromoCode(code);
  }

  @Get(':id')
  async getPromoCode(@Param('id') id: number): Promise<PromoCode> {
    return this.promoCodeService.getPromoCodeByID(+id);
  }

  @Post()
  @HttpCode(200)
  async createPromoCode(@Body() data: PromoCodeDto) {
    return this.promoCodeService.createPromoCode(data);
  }

  @Delete('code')
  async deletePromoCode(@Param('code') id: string) {
    return this.promoCodeService.deletePromoCode(id);
  }

  @Patch('update/:code')
  @UsePipes(new ValidationPipe())
  async updatePromoCode(
    @Body() data: UpdatePromoCodeDto,
    @Param('code') code: string,
  ) {
    return this.promoCodeService.updatePromoCode(data, code);
  }

  @Post('create/many')
  async createManyPromoCodes(data: number, discountSum: number) {
    return this.promoCodeService.createManyPromoCodes(data, discountSum);
  }
}
