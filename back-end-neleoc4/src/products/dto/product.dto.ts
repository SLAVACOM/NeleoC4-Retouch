import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ProductDto {
  @IsOptional()
  @IsNumber()
  id: number;



  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  generationCount: number;
}
