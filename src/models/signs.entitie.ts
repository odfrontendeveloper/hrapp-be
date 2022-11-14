import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { Competence } from './competencies.entitie'
import { Criterion } from './criteria.entitie'

export enum SignTypes {
    single = 'single',
    multi = 'multi',
}

export const signTypes = ['single', 'multi']

@Entity('signs')
export class Sign {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number

    @Column({
        type: 'text',
    })
    text: string

    @ManyToOne(() => Competence, (competence) => competence.signs, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'competenceId' })
    competence: Competence

    @OneToMany(() => Criterion, (criterion) => criterion.sign)
    criteria: Criterion[]

    @Column({
        type: 'enum',
        enum: signTypes,
        default: 'single',
    })
    type: SignTypes
}
