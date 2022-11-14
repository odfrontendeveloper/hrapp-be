import { IsNotEmpty, IsNumber, IsNumberString, IsString } from 'class-validator'

export class PositionIdDto {
    @IsNumberString()
    @IsNotEmpty()
    positionId: string
}

export class CreateTemplateDto {
    @IsString()
    @IsNotEmpty()
    name: string
}

export class TemplateIdDto {
    @IsNumberString()
    @IsNotEmpty()
    templateId: string
}
