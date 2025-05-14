import { IsString } from 'class-validator';

export class CollectionDto {
  @IsString()
  name: string;

  @IsString()
  description: string;
}
