import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SupportDto {
  @IsNumber()
  @IsOptional()
  id: number;

  @IsString()
  info: string;
}
