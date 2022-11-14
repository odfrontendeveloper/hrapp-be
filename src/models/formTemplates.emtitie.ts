import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { Competence } from './competencies.entitie'
import { Criterion } from './criteria.entitie'
import { FormCompetence } from './formCompetencies.entitie'
import { Position } from './positions.entitie'
import { SessionInvitation } from './sessioninvitations.entitie'

export enum SignTypes {
    single = 'single',
    multi = 'multi',
}

export const signTypes = ['single', 'multi']

@Entity('formTemplates')
export class FormTemplate {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number

    @Column({
        type: 'varchar',
        length: 250,
    })
    name: string

    @ManyToOne(() => Position, (position) => position.formTemplates, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'positionId' })
    position: Position

    @OneToMany(() => FormCompetence, (formCompetence) => formCompetence.formTemplate)
    formConnections: FormCompetence[]

    @OneToMany(() => SessionInvitation, (invitation) => invitation.formTemplate)
    invitations: SessionInvitation[]
}
