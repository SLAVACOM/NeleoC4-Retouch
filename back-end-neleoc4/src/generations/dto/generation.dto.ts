import { GenerationType } from '@prisma/client';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
export class GenerationDto {
  @IsNumber()
  @Min(0)
  userId: number;

  @IsEnum(GenerationType)
  type: GenerationType;

  @IsString()
  retouchId: string;
}

export class AddRetouch {
  @IsString()
  @Min(0)
  userId: number;
}
