import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UserPayload } from 'src/dto/createUser.dto'
import { calcPaginate } from 'src/helpers/pagination'
import { Permissions } from 'src/models/permissions.entitie'
import { Position } from 'src/models/positions.entitie'
import { Session } from 'src/models/sessions.entitie'
import { UserPosition } from 'src/models/userpositions.entitie'
import { Roles, User } from 'src/models/users.entitie'
import { UserConnection } from 'src/models/usersconnections.entitie'
import { UserCheckService } from 'src/user-check/user-check.service'
import { In, IsNull, Not, Repository, FindManyOptions, Like } from 'typeorm'
import * as constants from 'src/constants'
import * as fs from 'fs'
import * as rimraf from 'rimraf'
import { FormTemplate } from 'src/models/formTemplates.emtitie'
import { ICreateSession, IEditSession, IForm, IFormCompetence, SendFormBody } from './dto/sessions.dto'
import { uniqBy, uniq, cloneDeep } from 'lodash'
import { Competence } from 'src/models/competencies.entitie'
import { FormCompetence } from 'src/models/formCompetencies.entitie'
import { Criterion } from 'src/models/criteria.entitie'
import { Sign } from 'src/models/signs.entitie'
import { SessionInvitation } from 'src/models/sessioninvitations.entitie'

@Injectable()
export class SessionsService {
    constructor(
        private readonly userCheckService: UserCheckService,

        @InjectRepository(Sign)
        private signsRepository: Repository<Sign>,

        @InjectRepository(Criterion)
        private criteriaRepository: Repository<Criterion>,

        @InjectRepository(FormTemplate)
        private formsRepository: Repository<FormTemplate>,

        @InjectRepository(FormCompetence)
        private formConnectionsRepository: Repository<FormCompetence>,

        @InjectRepository(Position)
        private positionsRepository: Repository<Position>,

        @InjectRepository(User)
        private usersRepository: Repository<User>,

        @InjectRepository(UserPosition)
        private usersPositionsRepository: Repository<UserPosition>,

        @InjectRepository(UserConnection)
        private usersConnectionsRepository: Repository<UserConnection>,

        @InjectRepository(Session)
        private sessionsRepository: Repository<Session>,

        @InjectRepository(SessionInvitation)
        private sessionInvitationsRepository: Repository<SessionInvitation>,

        @InjectRepository(Competence)
        private competenciesRepository: Repository<Competence>
    ) {}

    async getFormsForPosition(user: UserPayload, positionConnectionId: number): Promise<FormTemplate[]> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_assessments], permissions)

            const findPositionConnection: UserPosition | undefined = await this.usersPositionsRepository.findOne({
                where: {
                    id: positionConnectionId,
                },
                relations: ['position'],
            })

            if (!findPositionConnection) throw new HttpException(constants.POSITION_NOT_FOUND, HttpStatus.BAD_REQUEST)

            const findPosition: Position | undefined = await this.positionsRepository.findOne({
                where: {
                    id: findPositionConnection.position.id,
                    user: {
                        id: parrent.id,
                    },
                },
            })

            if (!findPosition) throw new HttpException(constants.POSITION_NOT_FOUND, HttpStatus.BAD_REQUEST)

            const findTemplates: FormTemplate[] = await this.formsRepository.find({
                where: {
                    position: {
                        id: findPosition.id,
                    },
                },
            })

            return findTemplates.map((item) => ({ ...item, id: +item.id }))
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async getUsersForAssessment(
        user: UserPayload,
        searchString: string,
        pageNumber: number
    ): Promise<{
        results: User[]
        pagination: {
            totalPages: number
            page: number
        }
    }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_assessments], permissions)

            const getUserConnections: UserConnection[] = await this.usersConnectionsRepository.find({
                where: {
                    adminUser: {
                        id: parrent.id,
                    },
                },
                relations: ['user'],
            })

            const userIds = getUserConnections.map((item) => +item.user.id)

            const options: FindManyOptions<User> = {
                where: [
                    {
                        id: In(userIds),
                        firstname: Like(`%${searchString}%`),
                        userPosition: {
                            id: Not(IsNull()),
                        },
                    },
                    {
                        id: In(userIds),
                        middlename: Like(`%${searchString}%`),
                        userPosition: {
                            id: Not(IsNull()),
                        },
                    },
                    {
                        id: In(userIds),
                        lastname: Like(`%${searchString}%`),
                        userPosition: {
                            id: Not(IsNull()),
                        },
                    },
                ],
                relations: ['userPosition'],
                select: ['id', 'firstname', 'middlename', 'lastname'],
            }

            const count: number = await this.usersRepository.count(options)

            const { take, skip, totalPages, page } = calcPaginate(count, constants.GET_POSITIONS_PAGINATION, pageNumber)

            const getUsers: User[] = await this.usersRepository.find({
                ...options,
                take,
                skip,
            })

            return {
                results: getUsers.map((item) => ({ ...item, id: +item.id })),
                pagination: {
                    totalPages,
                    page,
                },
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async editSession(user: UserPayload, data: IEditSession, id: number): Promise<Session> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_assessments], permissions)

            const findSession = await this.sessionsRepository.findOne({
                where: {
                    id,
                    user: {
                        id: parrent.id,
                    },
                },
            })

            if (!findSession) throw new ForbiddenException()

            await this.sessionsRepository.update(
                {
                    id,
                },
                {
                    name: data.name,
                    isActive: data.isActive,
                }
            )

            return {
                ...findSession,
                ...data,
                id: +findSession.id,
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async deleteSession(user: UserPayload, id: number): Promise<number> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_assessments], permissions)

            const findSession = await this.sessionsRepository.findOne({
                where: {
                    id,
                    user: {
                        id: parrent.id,
                    },
                },
            })

            if (!findSession) throw new ForbiddenException()

            await this.sessionsRepository.delete({
                id,
            })

            if (fs.existsSync(`sessions/${id}`)) rimraf.sync(`sessions/${id}`)

            return id
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async getSessions(
        user: UserPayload,
        searchString: string,
        pageNumber: number
    ): Promise<{
        results: Session[]
        pagination: {
            totalPages: number
            page: number
        }
    }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_assessments], permissions)

            const options = {
                where: {
                    name: Like(`%${searchString}%`),
                    user: {
                        id: parrent.id,
                    },
                },
            }

            const count: number = await this.sessionsRepository.count(options)

            const { take, skip, totalPages, page } = calcPaginate(count, constants.GET_POSITIONS_PAGINATION, pageNumber)

            const getSessions: Session[] = await this.sessionsRepository.find({
                ...options,
                take,
                skip,
            })

            return {
                results: getSessions.map((item) => ({ ...item, id: +item.id })),
                pagination: {
                    totalPages,
                    page,
                },
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async createNewSession(user: UserPayload, body: ICreateSession): Promise<any> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_assessments], permissions)

            const { invitations } = body

            const uniqByKey = uniqBy(
                invitations.map((item) => ({
                    ...item,
                    key: [item.appraiserId, item.assessedEmployeeId, item.formId].join(''),
                })),
                'key'
            )

            if (invitations.length === 0) throw new ForbiddenException()

            const arrayOfIds = []

            uniqByKey.forEach((item) => {
                if (!arrayOfIds.includes(item.appraiserId)) {
                    arrayOfIds.push(item.appraiserId)
                }
                if (!arrayOfIds.includes(item.assessedEmployeeId)) {
                    arrayOfIds.push(item.assessedEmployeeId)
                }
            })

            const formsIDs = uniq(uniqByKey.map((item) => item.formId))

            const getUsers = await this.usersConnectionsRepository.find({
                where: {
                    adminUser: {
                        id: parrent.id,
                    },
                    user: {
                        id: In(arrayOfIds),
                    },
                },
                relations: ['user'],
            })

            if (getUsers.length !== arrayOfIds.length) {
                throw new ForbiddenException()
            }

            const getForms: FormTemplate[] = await this.formsRepository.find({
                where: {
                    id: In(formsIDs),
                },
                relations: ['position'],
            })

            const positionIds = uniq(getForms.map((item) => +item.position.id))

            const getPositions = await this.positionsRepository.find({
                where: {
                    id: In(positionIds),
                    user: {
                        id: parrent.id,
                    },
                },
            })

            if (getPositions.length !== positionIds.length) throw new ForbiddenException()

            const getFormCompetencies: FormCompetence[] = await this.formConnectionsRepository.find({
                where: {
                    formTemplate: {
                        id: In(getForms.map((item) => item.id)),
                    },
                },
                relations: ['competence', 'formTemplate'],
            })

            const getCompetencies: Competence[] = await this.competenciesRepository.find({
                where: {
                    formConnections: {
                        id: In(getFormCompetencies.map((item) => item.id)),
                    },
                },
                relations: ['signs'],
            })

            const getSigns: Sign[] = await this.signsRepository.find({
                where: {
                    competence: {
                        id: In(getCompetencies.map((item) => item.id)),
                    },
                },
                relations: ['competence', 'criteria'],
            })

            let errorsCount = 0

            const buildTemplates = getForms.map((formTemplate) => {
                const filteredCompetencies = getCompetencies.filter((item) =>
                    getFormCompetencies
                        .filter((el) => +el.formTemplate.id === +formTemplate.id)
                        .map((conn) => +conn.competence.id)
                        .includes(+item.id)
                )

                if (!filteredCompetencies.length) errorsCount = errorsCount + 1

                const newEvaluationForm = {
                    id: +formTemplate.id,
                    name: formTemplate.name,
                    competencies: filteredCompetencies.map((el) => {
                        const getFilteredSigns = getSigns.filter((sign) => +sign.competence.id === +el.id)

                        if (!getFilteredSigns.length) errorsCount = errorsCount + 1

                        return {
                            ...el,
                            id: +el.id,
                            signs: getFilteredSigns.map((sign) => {
                                if (!sign.criteria.length) errorsCount = errorsCount + 1

                                return {
                                    id: +sign.id,
                                    criteria: sign.criteria.map((criterion) => ({
                                        ...criterion,
                                        id: +criterion.id,
                                        selected: false,
                                    })),
                                    text: sign.text,
                                    type: sign.type,
                                }
                            }),
                        }
                    }),
                }

                return newEvaluationForm
            })

            if (errorsCount > 0) throw new HttpException(constants.INVALID_FORM_TEMPLATE, HttpStatus.BAD_REQUEST)

            const validateForms = await Promise.all(
                invitations.map(async (item) => {
                    const getUser = await this.usersRepository.findOne({
                        where: {
                            id: item.assessedEmployeeId,
                        },
                        relations: ['userPosition'],
                    })

                    if (!getUser) return false
                    if (!getUser.userPosition) return false

                    const getUserPosition = await this.usersPositionsRepository.findOne({
                        where: {
                            id: getUser.userPosition.id,
                        },
                        relations: ['position'],
                    })

                    if (!getUserPosition) return false
                    if (!getUserPosition.position) return false

                    const findForm = getForms.find(
                        (el) => +el.position.id === +getUserPosition.position.id && +el.id === +item.formId
                    )

                    if (!findForm) return false

                    return true
                })
            )

            if (!validateForms.every((item) => item)) throw new ForbiddenException()

            const createNewSession = new Session()
            createNewSession.isActive = 1
            createNewSession.name = body.name
            createNewSession.user = parrent

            const savedSession = await this.sessionsRepository.save(createNewSession)

            if (!fs.existsSync('sessions')) fs.mkdirSync('sessions')
            if (!fs.existsSync(`sessions/${savedSession.id}`)) fs.mkdirSync(`sessions/${savedSession.id}`)
            if (!fs.existsSync(`sessions/${savedSession.id}/forms`)) fs.mkdirSync(`sessions/${savedSession.id}/forms`)

            buildTemplates.map((template) => {
                fs.writeFileSync(`sessions/${savedSession.id}/forms/${template.id}.json`, JSON.stringify(template))
            })

            const createInvitations = invitations.map((el) => {
                const getUserFrom = getUsers.map((item) => item.user).find((item) => +item.id === +el.appraiserId)
                const getUserTo = getUsers.map((item) => item.user).find((item) => +item.id === +el.assessedEmployeeId)
                const getTemplate = getForms.find((item) => +item.id === +el.formId)

                if (!getUserFrom || !getUserTo || !getTemplate) return null

                const newInvitation = new SessionInvitation()
                newInvitation.appraiser = getUserFrom
                newInvitation.assessedEmployee = getUserTo
                newInvitation.formTemplate = getTemplate
                newInvitation.isActive = 1
                newInvitation.session = savedSession
                return newInvitation
            })

            await Promise.all(
                createInvitations.map(async (item) => {
                    return await this.sessionInvitationsRepository.save(item)
                })
            )

            return buildTemplates
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async getInvitations(user: UserPayload): Promise<
        {
            id: number
            assessedEmployee: string
            form: string
        }[]
    > {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)

            const myInvitations = await this.sessionInvitationsRepository.find({
                where: {
                    appraiser: {
                        id: current.id,
                    },
                    isActive: 1,
                    session: {
                        isActive: 1,
                    },
                },
                relations: ['appraiser', 'assessedEmployee', 'formTemplate'],
            })

            const res = myInvitations.map((item) => ({
                id: +item.id,
                assessedEmployee: [
                    item.assessedEmployee.firstname,
                    item.assessedEmployee.middlename,
                    item.assessedEmployee.lastname,
                ].join(' '),
                form: item.formTemplate.name,
            }))

            return res
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async sendForm(user: UserPayload, body: SendFormBody): Promise<{ created: true }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            const getCurrentTemplate = await this.getInvitation(user, body.id)

            const userData = JSON.stringify(body.data)
            const savedData = getCurrentTemplate

            let errors = 0

            const checkTemplate: IForm = JSON.parse(userData)

            const res = {
                ...checkTemplate,
                competencies: checkTemplate.competencies.map((cmp: IFormCompetence) => ({
                    ...cmp,
                    signs: cmp.signs.map((sign) => {
                        if (sign.criteria.filter((item) => item.selected).length > 1 && sign.type !== 'multi') {
                            errors = errors + 1
                        }
                        return {
                            ...sign,
                            criteria: sign.criteria.map((el) => ({ ...el, selected: false })),
                        }
                    }),
                })),
            }

            if (JSON.stringify(res) !== savedData) {
                throw new ForbiddenException()
            }

            if (errors > 0) {
                throw new ForbiddenException()
            }

            const myInvitation = await this.sessionInvitationsRepository.findOne({
                where: {
                    id: body.id,
                    appraiser: {
                        id: current.id,
                    },
                    isActive: 1,
                    session: {
                        isActive: 1,
                    },
                },
                relations: ['appraiser', 'assessedEmployee', 'formTemplate', 'session'],
            })

            if (!myInvitation) throw new ForbiddenException()

            if (!fs.existsSync(`sessions/${myInvitation.session.id}/results`)) {
                fs.mkdirSync(`sessions/${myInvitation.session.id}/results`)
            }

            fs.writeFileSync(`sessions/${myInvitation.session.id}/results/invitation-${myInvitation.id}.json`, userData)

            await this.sessionInvitationsRepository.update(
                {
                    id: body.id,
                },
                {
                    isActive: 0,
                }
            )

            return { created: true }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async getInvitation(user: UserPayload, id: number): Promise<any> {
        try {
            const { current } = await this.userCheckService.userDetails(user.id)

            const myInvitation = await this.sessionInvitationsRepository.findOne({
                where: {
                    id,
                    appraiser: {
                        id: current.id,
                    },
                    isActive: 1,
                    session: {
                        isActive: 1,
                    },
                },
                relations: ['appraiser', 'assessedEmployee', 'formTemplate', 'session'],
            })

            if (!myInvitation) throw new ForbiddenException()

            const path = `sessions/${myInvitation.session.id}/forms/${myInvitation.formTemplate.id}.json`

            if (!fs.existsSync(path)) throw new HttpException(constants.INCORRECT_DATA, HttpStatus.BAD_REQUEST)

            const readTemplate = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' })

            return readTemplate
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async getSessionDetails(user: UserPayload, sessionId: number): Promise<any[]> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_assessments], permissions)

            const getSession = await this.sessionsRepository.findOne({
                where: {
                    id: sessionId,
                    user: {
                        id: parrent.id,
                    },
                },
                relations: ['invitations'],
            })

            if (!getSession) throw new ForbiddenException()

            const getInvitations: SessionInvitation[] = await this.sessionInvitationsRepository.find({
                where: {
                    session: {
                        id: getSession.id,
                    },
                },
                relations: ['appraiser', 'assessedEmployee', 'formTemplate'],
            })

            const listOfReports = await Promise.all(
                getInvitations
                    // .filter((item) => !item.isActive)
                    .map(async (item) => {
                        let report = null

                        const path = `sessions/${getSession.id}/results/invitation-${item.id}.json`

                        if (fs.existsSync(path)) {
                            report = JSON.parse(fs.readFileSync(path, { encoding: 'utf8', flag: 'r' }))
                        }

                        return {
                            appraiser: [
                                item.appraiser.firstname,
                                item.appraiser.middlename,
                                item.appraiser.lastname,
                            ].join(' '),
                            assessedEmployee: [
                                item.assessedEmployee.firstname,
                                item.assessedEmployee.middlename,
                                item.assessedEmployee.lastname,
                            ].join(' '),
                            formTemplate: item.formTemplate.name,
                            id: +item.id,
                            report,
                        }
                    })
            )

            return listOfReports
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }
}
