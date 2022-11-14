import {
    IsArray,
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsString,
    Length,
    Max,
    Min,
} from 'class-validator'
import { Permissions } from 'src/models/permissions.entitie'
import { Roles } from 'src/models/users.entitie'

export class UpdateProfileDto {
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

    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string

    @Length(1, 250)
    @IsString()
    @IsNotEmpty()
    organizationName: string
}

export class UpdatePasswordDto {
    @IsString()
    @IsNotEmpty()
    oldpassword: string

    @IsString()
    @IsNotEmpty()
    newpassword: string
}

export class CreateUserByAdminDto {
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

    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string

    @IsString()
    @IsNotEmpty()
    password: string
}

export class SearchValueDto {
    @IsString()
    @IsOptional()
    searchString: string
}

export class PageNumberDto {
    @IsNumberString()
    @IsNotEmpty()
    page: string
}

export class UpdateUserPasswordDto {
    @IsNumber()
    @IsNotEmpty()
    userId: number

    @IsString()
    @IsNotEmpty()
    newPassword: string
}

export class UpdateUserProfileDto {
    @IsNumber()
    @IsNotEmpty()
    userId: number

    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string

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

    @IsNumber()
    @Min(0)
    @Max(1)
    @IsNotEmpty()
    isActive: 1 | 0
}

export class UpdateUserTypeDto {
    @IsNumber()
    @IsNotEmpty()
    userId: number

    @IsString()
    @IsNotEmpty()
    type: Roles
}

export class UpdateUserPermissionsDto {
    @IsNumber()
    @IsNotEmpty()
    userId: number

    @IsArray()
    @IsNotEmpty()
    permissions: Permissions[]
}

export class SetUserPositionDto {
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    positionId: number

    @IsNumber()
    @IsNotEmpty()
    userId: number
}

export class GetUsersParamsDto {
    @IsNotEmpty()
    @IsString()
    types: string

    @IsNotEmpty()
    @IsString()
    active: string

    @IsNotEmpty()
    @IsString()
    positions: string
}
