import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { Sign } from './signs.entitie'
import { Position } from './positions.entitie'
import { User } from './users.entitie'
import { FormCompetence } from './formCompetencies.entitie'

@Entity('competencies')
export class Competence {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number

    @Column({
        type: 'varchar',
        length: 250,
    })
    name: string

    @ManyToOne(() => Position, (position) => position.competencies, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'positionId' })
    position: Position

    @ManyToOne(() => User, (user) => user.competencies, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'userId' })
    user: User

    @OneToMany(() => Sign, (sign) => sign.competence)
    signs: []

    @OneToMany(() => FormCompetence, (formCompetence) => formCompetence.competence)
    formConnections: FormCompetence[]
}
