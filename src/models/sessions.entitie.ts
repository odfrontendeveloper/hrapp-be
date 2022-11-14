import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { SessionInvitation } from './sessioninvitations.entitie'
import { User } from './users.entitie'

@Entity('sessions')
export class Session {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number

    @Column({
        type: 'varchar',
        length: 250,
    })
    name: string

    @OneToMany(() => SessionInvitation, (invite) => invite.session)
    invitations: SessionInvitation[]

    @ManyToOne(() => User, (user) => user.sessions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user: User

    @Column('tinyint')
    isActive: 1 | 0
}
