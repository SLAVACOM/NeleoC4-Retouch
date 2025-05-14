import {
	IsNumber,
	IsString,
} from 'class-validator'

export class CreateUserDto {
	@IsNumber()
  telegramId: number;
	
	@IsString()
	username: string;

	@IsString()
  fullName: string;
}

export class UpdateUserDto {
	@IsString()
  username?: string;

	@IsString()
	fullName?: string;
}