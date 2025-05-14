import { RoleEnum } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class IWorker {
  @IsNumber()
  id: number;

  @IsEnum(RoleEnum, { each: true })
  @IsArray()
  roles: RoleEnum[];

  @IsString()
  @IsOptional()
  login?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;
}
