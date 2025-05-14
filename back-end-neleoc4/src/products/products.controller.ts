import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';
import { console } from 'inspector'

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  async getAllProducts(
    @Query('name') name: string,
    @Query('sortKey') sortKey = 'id',
    @Query('sortDirection') sortDirection = 'asc',
    @Query('page') page = 1,
    @Query('perPage') perPage: string,
    @Query('status') status = 'all',
  ){
  
    const params = {
      name,
      sortKey,
      sortDirection,
      page: Number(page),
      perPage: Number(perPage),
      status,
    };
    return this.productsService.getAllProducts(params); 
  }

  @Get(':id')
  async getProductById(@Param('id') id: number): Promise<ProductDto> {
    return this.productsService.getProduct(+id);
  }

 
  @Post()
  @UsePipes(new ValidationPipe())
  async createProduct(@Body() data: ProductDto): Promise<ProductDto> {
    return this.productsService.createProduct(data);
  }

  @Put()
  @UsePipes(new ValidationPipe())
  async updateProduct(@Body() data: ProductDto): Promise<ProductDto> {
    console.log('data', data);
    return this.productsService.updateProduct(data);
  }
}
