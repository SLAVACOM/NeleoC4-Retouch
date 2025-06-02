import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getAllProducts(params: any) {
    const { name, sortKey, sortDirection, page, perPage, status } = params;

    const where: { name?: { contains: any }; IsDelete?: boolean } = name
      ? { name: { contains: name } }
      : {};

    if (status !== 'all') {
      where.IsDelete = status !== 'active';
    }

    const orderBy = sortKey ? { [sortKey]: sortDirection } : undefined;
    const skip = page && perPage ? (page - 1) * perPage : 0;
    const take = perPage ? perPage : undefined;

    const count = await this.prisma.product.count({
      where,
    });
    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
    });
    const totalPages = Math.ceil(count / (perPage || 1));

    return {
      products,
      count,
      totalPages,
    };
  }

  async getProduct(id: number): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(data: any): Promise<ProductDto> {
    let product = await this.prisma.product.findFirst({
      where: {
        name: data.name,
      },
    });

    if (product) throw new BadRequestException('Product already exists');

    console.log('data', data);
    return this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        generationCount: data.generationCount,
        description: data.description,
        IsDelete: data.IsDelete || false,
      },
    });
  }

  async updateProduct(data: any): Promise<ProductDto> {
    if (!data.id) throw new BadRequestException('Product ID is required');
    const product = await this.prisma.product.findFirst({
      where: {
        name: data.name,
      },
    });

    if (product && product.id !== data.id)
      throw new BadRequestException('Product already exists');

    return this.prisma.product.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        price: data.price,
        generationCount: data.generationCount,
        description: data.description,

        IsDelete: data.IsDelete || false,
      },
    });
  }
}
