import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail, MinLength, IsNotEmpty } from "class-validator";

export class RegisterDto {
    @ApiProperty({ example: 'Эльнура'})
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Ертай'})
    @IsString()
    @IsNotEmpty()
    surname: string;

    @ApiProperty({ example: 'email@email.com'})
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'Developer', required: false })
    @IsString()
    @IsNotEmpty()
    position: string;

    @ApiProperty({ example: 'password123', minLength: 6 })
    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    password: string;
}