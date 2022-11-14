import { Max, Min } from 'class-validator'
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { Competence } from './competencies.entitie'
import { Sign } from './signs.entitie'

@Entity('criteria')
export class Criterion {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number

    @Column({
        type: 'text',
    })
    text: string

    @Column({
        type: 'int',
    })
    @Min(0)
    @Max(100)
    value: number

    @ManyToOne(() => Sign, (sign) => sign.criteria, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'signId' })
    sign: Sign
}
