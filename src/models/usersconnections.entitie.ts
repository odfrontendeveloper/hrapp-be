import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm'
import { User } from './users.entitie'

@Entity('usersconnections')
export class UserConnection {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number

    @ManyToOne(() => User, (user) => user.adminUser, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'adminUserId' })
    adminUser: User

    @OneToOne(() => User, (user) => user.user, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user: User
}
