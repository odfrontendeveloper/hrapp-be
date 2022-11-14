import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './users.entitie'

export enum Permissions {
    can_manage_staff = 'can_manage_staff',
    can_manage_forms = 'can_manage_forms',
    can_manage_assessments = 'can_manage_assessments',
}

export const permissions = ['can_manage_staff', 'can_manage_forms', 'can_manage_assessments']

@Entity('permissions')
export class Permission {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number

    @ManyToOne(() => User, (user) => user.permissions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user: User

    @Column({
        type: 'enum',
        enum: permissions,
    })
    type: Permissions
}
