import { IsEmail } from 'class-validator'
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm'
import { Competence } from './competencies.entitie'
import { Permission } from './permissions.entitie'
import { Position } from './positions.entitie'
import { SessionInvitation } from './sessioninvitations.entitie'
import { Session } from './sessions.entitie'
import { UserPosition } from './userpositions.entitie'
import { UserConnection } from './usersconnections.entitie'

export enum Roles {
    owner = 'owner',
    admin = 'admin',
    staff = 'staff',
}

export const roles = ['owner', 'admin', 'staff']

@Entity('users')
export class User {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number

    @Column({
        type: 'varchar',
        length: 250,
    })
    firstname: string

    @Column({
        type: 'varchar',
        length: 250,
    })
    middlename: string

    @Column({
        type: 'varchar',
        length: 250,
    })
    lastname: string

    @Column({
        type: 'varchar',
        length: 250,
    })
    @IsEmail()
    email: string

    @Column({
        type: 'varchar',
        length: 250,
        nullable: true,
    })
    organizationName: string

    @Column({
        type: 'text',
    })
    password: string

    @Column({
        type: 'enum',
        enum: roles,
    })
    type: Roles

    @Column('tinyint')
    isActive: 1 | 0

    @OneToMany(() => UserConnection, (userConnection) => userConnection.adminUser)
    adminUser: UserConnection[]

    @OneToOne(() => UserConnection, (userConnection) => userConnection.user)
    user: UserConnection

    @OneToMany(() => Permission, (permission) => permission.user)
    permissions: Permission[]

    @OneToMany(() => Position, (position) => position.user)
    positions: Position[]

    @OneToMany(() => Session, (session) => session.user)
    sessions: Session[]

    @OneToOne(() => UserPosition, (userPosition) => userPosition.user)
    userPosition: UserPosition

    @OneToMany(() => Competence, (competence) => competence.user)
    competencies: Competence[]

    @OneToMany(() => SessionInvitation, (sessioninvitation) => sessioninvitation.appraiser)
    appraiser: SessionInvitation[]

    @OneToMany(() => SessionInvitation, (sessioninvitation) => sessioninvitation.assessedEmployee)
    assessedEmployee: SessionInvitation[]
}
