import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm'
import { FormTemplate } from './formTemplates.emtitie'
import { Session } from './sessions.entitie'
import { User } from './users.entitie'

@Entity('sessioninvitations')
export class SessionInvitation {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number

    @ManyToOne(() => User, (user) => user.appraiser, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'appraiserId' })
    appraiser: User

    @ManyToOne(() => User, (user) => user.assessedEmployee, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'assessedEmployeeId' })
    assessedEmployee: User

    @ManyToOne(() => Session, (session) => session.invitations, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'sessionId' })
    session: Session

    @ManyToOne(() => FormTemplate, (template) => template.invitations, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'formTemplateId' })
    formTemplate: FormTemplate

    @Column('tinyint')
    isActive: 1 | 0
}
