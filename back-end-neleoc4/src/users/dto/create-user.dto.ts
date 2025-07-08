import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateUserDto {
  @IsNumber()
  telegramId: bigint | number;

  @IsString()
  username: string;

  @IsString()
  fullName: string;

  @IsString()
  language: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  freeGenerationCount?: number;
}

export class UpdateUserDto {
  @IsNumber()
  @Min(0)
  freeGenerationCount?: number;

  @IsNumber()
  id: number;

  @IsNumber()
  @Min(0)
  paymentGenerationCount?: number;
}

export class UpdateCountDto {
  @IsInt()
  @Min(0)
  count: number;
}
