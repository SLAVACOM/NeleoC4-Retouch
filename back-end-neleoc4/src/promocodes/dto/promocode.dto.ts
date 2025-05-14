import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdatePromoCodeDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsOptional()
  discountSum: number;

  @IsNumber()
  @IsOptional()
  discountPercentage: number;

  @IsNumber()
  @IsOptional()
  generationCount: number;

  @IsOptional()
  @IsBoolean()
  @IsOptional()
  isMultiUse: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  usesLeft: number;

  @IsOptional()
  @IsDateString()
  expirationDate: Date;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}

export class PromoCodeDto {
  @IsNumber()
  @IsOptional()
  id: number;

  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @Min(0)
  discountSum: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @IsNumber()
  @Min(1)
  generationCount: number;

  @IsOptional()
  @IsBoolean()
  isMultiUse: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  usesLeft: number;

  @IsOptional()
  @IsDateString()
  expirationDate: Date;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}

export class PromoCodeDiscountSumSumDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @Min(0)
  discountSum: number;

  @IsOptional()
  @IsBoolean()
  isMultiUse: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  usesLeft: number;

  @IsOptional()
  @IsDateString()
  expirationDate: Date;
}

export class PromoCodeDiscountPercentageDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @IsOptional()
  @IsBoolean()
  isMultiUse: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  usesLeft: number;

  @IsOptional()
  @IsDateString()
  expirationDate: Date;
}

export class PromoCodeAddGenerationDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @Min(1)
  generationCount: number;

  @IsOptional()
  @IsBoolean()
  isMultiUse: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  usesLeft: number;

  @IsOptional()
  @IsDateString()
  expirationDate: Date;
}
