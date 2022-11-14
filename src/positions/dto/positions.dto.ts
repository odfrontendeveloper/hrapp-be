import { IsJSON, IsNotEmpty, IsNumberString, IsOptional, IsString, Length } from 'class-validator'

export class CreatePositionDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 250)
    name: string
}

export class SelectedPositionsDto {
    @IsJSON()
    @IsNotEmpty()
    selected: string
}
