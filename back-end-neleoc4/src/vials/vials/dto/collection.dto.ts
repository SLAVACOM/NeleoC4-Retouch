import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class VialsDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  vialCollectionId: number;

  @IsString()
  name: string;

  @IsString()
  photoUrl: string;

  @IsBoolean()
  @IsOptional()
  isDelete?: boolean;
}
