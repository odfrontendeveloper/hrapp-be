import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { Sign } from './signs.entitie'
import { Position } from './positions.entitie'
import { User } from './users.entitie'
import { Competence } from './competencies.entitie'
import { FormTemplate } from './formTemplates.emtitie'

@Entity('formCompetencies')
export class FormCompetence {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number

    @ManyToOne(() => Competence, (competence) => competence.formConnections, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'competenceId' })
    competence: Competence

    @ManyToOne(() => FormTemplate, (formTemplate) => formTemplate.formConnections, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'formTemplateId' })
    formTemplate: FormTemplate
}
