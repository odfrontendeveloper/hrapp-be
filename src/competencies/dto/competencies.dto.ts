import { IsArray, IsNotEmpty, IsNumber, IsNumberString, IsString, Length, Min } from 'class-validator'
import { SignTypes } from 'src/models/signs.entitie'

export class GetCompetenciesDto {
    @IsNumberString()
    @IsNotEmpty()
    positionId: string
}

export class CreateCompetenceDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 250)
    name: string

    @IsNumber()
    @IsNotEmpty()
    positionId: number
}

export class EditCompetenceDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 250)
    name: string

    @IsNumber()
    @IsNotEmpty()
    competenceId: number
}

export class CompetenceIdDto {
    @IsNumberString()
    @IsNotEmpty()
    competenceId: string
}

export class CreateSignCriteriaDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 2250)
    text: string

    @IsNumber()
    @Min(0)
    @Min(100)
    value: number
}

export class CreateSignDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 2250)
    text: string

    @IsString()
    @IsNotEmpty()
    type: SignTypes

    @IsNotEmpty()
    @IsArray()
    criteria: CreateSignCriteriaDto[]
}

export class EditSignCriteriaDto {
    @IsNotEmpty()
    id: number | string

    @IsString()
    @IsNotEmpty()
    @Length(1, 2250)
    text: string

    @IsNumber()
    @Min(0)
    @Min(100)
    value: number
}

export class EditSignDto {
    @IsNumber()
    @IsNotEmpty()
    id: number

    @IsString()
    @IsNotEmpty()
    @Length(1, 2250)
    text: string

    @IsString()
    @IsNotEmpty()
    type: SignTypes

    @IsNotEmpty()
    @IsArray()
    criteria: EditSignCriteriaDto[]
}

export class SignIdDto {
    @IsNumberString()
    @IsNotEmpty()
    signId: string
}
