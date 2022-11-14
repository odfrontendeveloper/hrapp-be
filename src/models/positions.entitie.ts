import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { Competence } from './competencies.entitie'
import { FormTemplate } from './formTemplates.emtitie'
import { UserPosition } from './userpositions.entitie'
import { User } from './users.entitie'

@Entity('positions')
export class Position {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number

    @ManyToOne(() => User, (user) => user.positions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user: User

    @Column({
        type: 'varchar',
        length: 250,
    })
    name: string

    @OneToMany(() => UserPosition, (positionConnection) => positionConnection.position)
    positionConnections: UserPosition[]

    @OneToMany(() => Competence, (competence) => competence.position)
    competencies: Competence[]

    @OneToMany(() => FormTemplate, (formTemplate) => formTemplate.position)
    formTemplates: FormTemplate[]
}
