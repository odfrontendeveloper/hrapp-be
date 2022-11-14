import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm'
import { Position } from './positions.entitie'
import { User } from './users.entitie'

@Entity('userspositions')
export class UserPosition {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number

    @OneToOne(() => User, (user) => user.positions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user: User

    @ManyToOne(() => Position, (position) => position.positionConnections, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'positionId' })
    position: Position
}
