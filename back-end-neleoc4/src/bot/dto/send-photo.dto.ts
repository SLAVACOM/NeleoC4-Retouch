import { IsNumber, IsOptional, IsString } from 'class-validator'

export class SendPhotoDto {

	@IsOptional()
	@IsString()
	message?: string;

	@IsNumber()
	userId: number;

	@IsString()
	photoURL: string;
}