import { IsArray, IsJSON, IsNotEmpty, IsNumber, IsNumberString, IsString } from 'class-validator'

export class ICreateSessionAssessment {
    @IsNotEmpty()
    @IsNumber()
    appraiserId: number

    @IsNotEmpty()
    @IsNumber()
    assessedEmployeeId: number

    @IsNotEmpty()
    @IsNumber()
    formId: number
}

export class ICreateSession {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsArray()
    invitations: ICreateSessionAssessment[]
}

export class IEditSession {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsNumber()
    isActive: 0 | 1
}

export class IdDto {
    @IsNotEmpty()
    @IsNumberString()
    id: string
}

export interface IFormCriteria {
    id: number
    text: string
    value: number
    selected: boolean
}

export interface IFormSign {
    id: number
    text: string
    type: 'single' | 'multi'
    criteria: IFormCriteria[]
}

export interface IFormCompetence {
    id: number
    name: string
    signs: IFormSign[]
}

export interface IForm {
    id: number
    name: string
    competencies: IFormCompetence[]
}

export class SendFormBody {
    @IsNotEmpty()
    @IsNumber()
    id: number

    @IsNotEmpty()
    data: IForm
}
