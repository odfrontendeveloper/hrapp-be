import { IsEmail, IsNotEmpty, IsNumber, IsNumberString, IsString, Length } from 'class-validator'

export class CreateUserDto {
    @Length(1, 250)
    @IsString()
    @IsNotEmpty()
    firstname: string

    @Length(1, 250)
    @IsString()
    @IsNotEmpty()
    middlename: string

    @Length(1, 250)
    @IsString()
    @IsNotEmpty()
    lastname: string

    @Length(1, 250)
    @IsString()
    @IsNotEmpty()
    organizationName: string

    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string

    @IsString()
    @IsNotEmpty()
    password: string
}

export class UserPayload {
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string

    @IsNotEmpty()
    @IsNumber()
    id: number
}

export class StringIdDto {
    @IsNotEmpty()
    @IsNumberString()
    id: string
}
