import {
	IsNumber,
	IsString,
	Min,
} from 'class-validator'

export class CreateUserDto {
	@IsNumber()
  telegramId: bigint | number
	
	@IsString()
	username: string;

	@IsString()
  fullName: string;

	@IsString()
	language: string;
}

export class UpdateUserDto {
	@IsNumber()
	@Min(0)
  free?: number;

	@IsNumber()
  id: number

	@IsNumber()
	@Min(0)
	paid?: number;
}