import { GenerationType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Max } from 'class-validator';

export class SendRetouchDto {
  file: Buffer;

  @IsString()
  @IsOptional()
  retouchApiId?: string;

  @IsString()
  retouchURL: string;

  @IsNumber()
  userId: number;

  @IsString()
  token: string;

  @IsNumber()
  @IsOptional()
  @Max(3)
  settingsId: number;

  @IsEnum(GenerationType)
  type: GenerationType;

  @IsNumber()
  @IsOptional()
  generationNumber?: number;
}
