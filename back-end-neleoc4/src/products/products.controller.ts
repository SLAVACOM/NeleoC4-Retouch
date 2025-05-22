import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

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
  ) {
    Logger.log(
      `GET - /products\nRequest\nname: ${name}, sortKey: ${sortKey}, sortDirection: ${sortDirection}, page: ${page}, perPage: ${perPage}, status: ${status}`,
    );
    const params = {
      name,
      sortKey,
      sortDirection,
      page: Number(page),
      perPage: Number(perPage),
      status,
    };
    const response = await this.productsService.getAllProducts(params);
    Logger.log('GET - /products\nResponse\n' + JSON.stringify(response));
    return response;
  }

  @Get(':id')
  async getProductById(@Param('id') id: number): Promise<ProductDto> {
    Logger.log(`GET - /products/${id}\nRequest`);
    const response = await this.productsService.getProduct(+id);
    Logger.log(`GET - /products/${id}\nResponse\n` + JSON.stringify(response));
    return response;
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async createProduct(@Body() data: ProductDto): Promise<ProductDto> {
    Logger.log('POST - /products\nRequest\n' + JSON.stringify(data));
    const response = await this.productsService.createProduct(data);
    Logger.log('POST - /products\nResponse\n' + JSON.stringify(response));
    return response;
  }

  @Put()
  @UsePipes(new ValidationPipe())
  async updateProduct(@Body() data: ProductDto): Promise<ProductDto> {
    Logger.log('PUT - /products\nRequest\n' + JSON.stringify(data));
    const response = await this.productsService.updateProduct(data);
    Logger.log('PUT - /products\nResponse\n' + JSON.stringify(response));
    return response;
  }
}
