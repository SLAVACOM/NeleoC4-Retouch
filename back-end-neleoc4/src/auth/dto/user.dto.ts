import { IsEmail, IsOptional, IsString } from "class-validator";

export class UserDto{
    @IsEmail()
    email: string

    @IsOptional()
    @IsString()
    password?: string
   
    @IsOptional()
    @IsString()
    fullName:string

    @IsOptional()
    @IsString()
    firstName:string

    @IsOptional()
    @IsString()
    lastName:string

    @IsOptional()
    @IsString()
    avatarPath: string

    @IsOptional()
    @IsString()
    phone?:string

}