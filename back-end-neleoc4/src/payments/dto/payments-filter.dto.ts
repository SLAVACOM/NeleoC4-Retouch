import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class PaymentFilterDto {
  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    {
      message:
        'minAmount must be a number conforming to the specified constraints',
    },
  )
  @Min(0, { message: 'minAmount must not be less than 0' })
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    {
      message:
        'maxAmount must be a number conforming to the specified constraints',
    },
  )
  @Min(0, { message: 'maxAmount must not be less than 0' })
  maxAmount?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], {
    message: 'sortDirection must be either asc or desc',
  })
  sortDirection?: string;

  @IsOptional()
  @IsString()
  @IsIn(['amount', 'date', 'userName', 'promoCode'], {
    message: 'orderBy must be one of: amount, date, userName, promoCode',
  })
  orderBy?: string;
}
