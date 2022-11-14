import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Competence } from 'src/models/competencies.entitie'
import { FormTemplate } from 'src/models/formTemplates.emtitie'
import { Permissions } from 'src/models/permissions.entitie'
import { Position } from 'src/models/positions.entitie'
import { Sign } from 'src/models/signs.entitie'
import { UserPosition } from 'src/models/userpositions.entitie'
import { Roles, User } from 'src/models/users.entitie'
import { UserConnection } from 'src/models/usersconnections.entitie'
import { Repository } from 'typeorm'
import * as constants from '../constants'
import { IPermissions } from './dto/permissions.dto'

@Injectable()
export class UserCheckService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,

        @InjectRepository(UserConnection)
        private usersConnectionsRepository: Repository<UserConnection>,

        @InjectRepository(UserPosition)
        private usersPositionsRepository: Repository<UserPosition>,

        @InjectRepository(Sign)
        private signsRepository: Repository<Sign>,

        @InjectRepository(Position)
        private positionsRepository: Repository<Position>,

        @InjectRepository(Competence)
        private competenciesRepository: Repository<Competence>,

        @InjectRepository(FormTemplate)
        private templatesRepository: Repository<FormTemplate>
    ) {}

    requirePermissions(permissions: Permissions[], currentPermissions: IPermissions): void {
        const validate: boolean = permissions.every((permission) => {
            return currentPermissions[permission]
        })

        if (!validate) throw new ForbiddenException()
    }

    requireUserType(allowedRoles: Roles[], currentType: Roles) {
        const validate: boolean = allowedRoles.includes(currentType)
        if (!validate) throw new ForbiddenException()
    }

    async isUserInOrganization(
        userId: number,
        parrent: User
    ): Promise<{ findUser: User & { positionInfo: Position | null }; positionConnection: UserPosition | null }> {
        try {
            const findUser: User = await this.usersRepository.findOne({
                where: {
                    id: userId,
                },
                select: ['id', 'firstname', 'middlename', 'lastname', 'email', 'type', 'permissions', 'isActive'],
                relations: ['permissions', 'adminUser', 'user', 'userPosition'],
            })

            if (!findUser) throw new HttpException(constants.USER_NOT_FOUND, HttpStatus.BAD_REQUEST)

            const findConnection: UserConnection = await this.usersConnectionsRepository.findOne({
                where: {
                    id: findUser.user.id,
                    adminUser: {
                        id: parrent.id,
                    },
                    user: {
                        id: userId,
                    },
                },
                relations: ['adminUser', 'user'],
            })

            if (!findConnection) throw new ForbiddenException()

            const findPositionConnection: UserPosition = await this.usersPositionsRepository.findOne({
                where: {
                    user: {
                        id: findUser.id,
                    },
                },
                relations: ['position'],
            })

            let positionInfo = findPositionConnection?.position || null

            if (positionInfo) {
                positionInfo = {
                    ...positionInfo,
                    id: +positionInfo.id,
                }
            }

            return {
                findUser: { ...findUser, id: +findUser.id, positionInfo },
                positionConnection: findPositionConnection || null,
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async userDetails(userId: number): Promise<{
        current: User
        permissions: IPermissions
        parrent: User
    }> {
        try {
            const getUser: User | undefined = await this.usersRepository.findOne({
                where: {
                    id: userId,
                    isActive: 1,
                },
                relations: ['permissions'],
            })

            if (!getUser) throw new HttpException(constants.USER_NOT_FOUND, HttpStatus.BAD_REQUEST)

            let parrent = {
                ...getUser,
            }

            if (getUser.type !== Roles.owner) {
                const userConnection = await this.usersConnectionsRepository.findOne({
                    where: {
                        user: {
                            id: getUser.id,
                        },
                    },
                    relations: ['adminUser'],
                })

                if (!userConnection) throw new HttpException(constants.USER_NOT_FOUND, HttpStatus.BAD_REQUEST)

                const findParrentUser = await this.usersRepository.findOne({
                    where: {
                        id: userConnection.adminUser.id,
                    },
                })

                if (!findParrentUser) throw new HttpException(constants.USER_NOT_FOUND, HttpStatus.BAD_REQUEST)

                getUser.organizationName = findParrentUser.organizationName
                parrent = findParrentUser
            }

            await this.isUserInOrganization(userId, parrent)

            const permissions = {
                can_manage_staff: false,
                can_manage_forms: false,
                can_manage_assessments: false,
            }

            const permissionsArray = getUser.permissions.map((item) => item.type)

            if (getUser.type === Roles.owner) {
                permissions.can_manage_staff = true
                permissions.can_manage_forms = true
                permissions.can_manage_assessments = true
            } else if (getUser.type === Roles.admin) {
                permissions.can_manage_staff = permissionsArray.includes(Permissions.can_manage_staff)
                permissions.can_manage_forms = permissionsArray.includes(Permissions.can_manage_forms)
                permissions.can_manage_assessments = permissionsArray.includes(Permissions.can_manage_assessments)
            } else if (getUser.type === Roles.staff) {
                permissions.can_manage_staff = false
                permissions.can_manage_forms = false
                permissions.can_manage_assessments = false
            }

            return {
                current: getUser,
                permissions,
                parrent,
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async isPositionInOrganization(positionId: number, parrentId: number): Promise<{ findPosition: Position }> {
        try {
            const findPosition = await this.positionsRepository.findOne({
                where: {
                    id: +positionId,
                    user: {
                        id: parrentId,
                    },
                },
            })

            if (!findPosition) {
                throw new HttpException(constants.POSITION_NOT_FOUND, HttpStatus.BAD_REQUEST)
            }

            return {
                findPosition: { ...findPosition, id: +findPosition.id },
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async isTemplateInOrganization(
        templateId: number,
        parrentId: number
    ): Promise<{ findTemplate: FormTemplate; findPosition: Position }> {
        try {
            const findTemplate = await this.templatesRepository.findOne({
                where: {
                    id: +templateId,
                },
                relations: ['position'],
            })

            if (!findTemplate) {
                throw new HttpException(constants.TEMPLATE_NOT_FOUND, HttpStatus.BAD_REQUEST)
            }

            const findPosition = await this.positionsRepository.findOne({
                where: {
                    id: +findTemplate.position.id,
                    user: {
                        id: parrentId,
                    },
                },
            })

            if (!findPosition) {
                throw new HttpException(constants.POSITION_NOT_FOUND, HttpStatus.BAD_REQUEST)
            }

            return {
                findTemplate: {
                    ...findTemplate,
                    id: +findTemplate.id,
                    position: { ...findTemplate.position, id: +findTemplate.position.id },
                },
                findPosition: { ...findPosition, id: +findPosition.id },
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async isCompetenceInOrganization(
        competenceId: number,
        parrentId: number
    ): Promise<{ findCompetence: Competence; findPosition: Position }> {
        try {
            const findCompetence = await this.competenciesRepository.findOne({
                where: {
                    id: +competenceId,
                },
                relations: ['position'],
            })

            if (!findCompetence) {
                throw new HttpException(constants.COMPETENCE_NOT_FOUND, HttpStatus.BAD_REQUEST)
            }

            const findPosition = await this.positionsRepository.findOne({
                where: {
                    id: +findCompetence.position.id,
                    user: {
                        id: parrentId,
                    },
                },
            })

            if (!findPosition) {
                throw new HttpException(constants.POSITION_NOT_FOUND, HttpStatus.BAD_REQUEST)
            }

            return {
                findCompetence: {
                    ...findCompetence,
                    id: +findCompetence.id,
                    position: { ...findCompetence.position, id: +findCompetence.position.id },
                },
                findPosition: { ...findPosition, id: +findPosition.id },
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async isSignInOrganization(
        signId: number,
        parrentId: number
    ): Promise<{ findCompetence: Competence; findPosition: Position; findSign: Sign }> {
        try {
            const findSign = await this.signsRepository.findOne({
                where: {
                    id: signId,
                },
                relations: ['competence', 'criteria'],
            })

            if (!findSign) throw new HttpException(constants.SIGN_NOT_FOUND, HttpStatus.BAD_REQUEST)

            const { findCompetence, findPosition } = await this.isCompetenceInOrganization(
                +findSign.competence.id,
                parrentId
            )

            return {
                findCompetence,
                findPosition,
                findSign: {
                    ...findSign,
                    id: +findSign.id,
                    competence: { ...findSign.competence, id: +findSign.competence.id },
                    criteria: findSign.criteria.map((item) => ({ ...item, id: +item.id })),
                },
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }
}
