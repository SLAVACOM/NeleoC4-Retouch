import {
	IsNumber,
	IsString,
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
	@IsString()
  username?: string;

	@IsString()
	fullName?: string;
}