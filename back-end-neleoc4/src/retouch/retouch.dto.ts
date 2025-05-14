import { IsNumber, IsString, Min } from 'class-validator';

export class RetouchDto {
  @IsString()
  retouchApiId: string;

  @IsNumber()
  @Min(0)
  settingsId: number;
}
