import { IsNumber, Max, Min } from 'class-validator';

export class DiscountDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;
}
