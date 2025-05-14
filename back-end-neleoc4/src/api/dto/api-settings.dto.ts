import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ApiSettingDto {
  @IsOptional()
  @IsNumber()
  id: number;

  @IsString()
  settings: string;
}

export class UrlDto {
  @IsOptional()
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  data: string;

  @IsOptional()
  @IsString()
  name: string;
}

export class BaseSettingDto {
  id: number;

  settingsId: number;
  name: string;
}
