import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UserPayload } from 'src/dto/createUser.dto'
import { Competence } from 'src/models/competencies.entitie'
import { Sign, SignTypes } from 'src/models/signs.entitie'
import { Permissions } from 'src/models/permissions.entitie'
import { Position } from 'src/models/positions.entitie'
import { Roles, User } from 'src/models/users.entitie'
import { UserCheckService } from 'src/user-check/user-check.service'
import { Repository } from 'typeorm'
import * as constants from '../constants'
import { CreateCompetenceDto, CreateSignDto, EditCompetenceDto, EditSignDto } from './dto/competencies.dto'
import { Criterion } from 'src/models/criteria.entitie'

@Injectable()
export class CompetenciesService {
    constructor(
        private readonly userCheckService: UserCheckService,

        @InjectRepository(Sign)
        private signsRepository: Repository<Sign>,

        @InjectRepository(Criterion)
        private criteriaRepository: Repository<Criterion>,

        @InjectRepository(Position)
        private positionsRepository: Repository<Position>,

        @InjectRepository(Competence)
        private competenciesRepository: Repository<Competence>
    ) {}

    async getPositionCompetencies(user: UserPayload, positionId: number): Promise<Position> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const findPosition: Position | undefined = await this.positionsRepository.findOne({
                where: {
                    id: positionId,
                    user: {
                        id: parrent.id,
                    },
                },
                relations: ['competencies'],
            })

            if (!findPosition) throw new HttpException(constants.POSITION_NOT_FOUND, HttpStatus.BAD_REQUEST)

            findPosition.id = +findPosition.id
            findPosition.competencies = findPosition.competencies.map((item) => ({ ...item, id: +item.id }))

            return findPosition
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async createPoitionCompetence(user: UserPayload, body: CreateCompetenceDto): Promise<Competence> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const findPosition: Position | undefined = await this.positionsRepository.findOne({
                where: {
                    id: +body.positionId,
                    user: {
                        id: parrent.id,
                    },
                },
            })

            if (!findPosition) throw new HttpException(constants.POSITION_NOT_FOUND, HttpStatus.BAD_REQUEST)

            const newCompetence = new Competence()
            newCompetence.name = body.name
            newCompetence.position = findPosition
            newCompetence.user = parrent

            const newCompetenceSaved = await this.competenciesRepository.save(newCompetence)

            const result = { ...newCompetenceSaved }

            delete result.position
            delete result.user

            return { ...result, id: +result.id }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async editPositionCompetence(user: UserPayload, body: EditCompetenceDto): Promise<Competence> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const { findCompetence } = await this.userCheckService.isCompetenceInOrganization(
                body.competenceId,
                parrent.id
            )

            await this.competenciesRepository.update(
                {
                    id: +findCompetence.id,
                },
                {
                    name: body.name,
                }
            )

            const findUpdatedCompetence = await this.competenciesRepository.findOne({
                where: {
                    id: +body.competenceId,
                },
            })

            if (!findUpdatedCompetence) {
                throw new HttpException(constants.COMPETENCE_NOT_FOUND, HttpStatus.BAD_REQUEST)
            }

            return {
                ...findUpdatedCompetence,
                id: +findUpdatedCompetence.id,
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async deletePositionCompetence(user: UserPayload, competenceId: number): Promise<{ id: number }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const { findCompetence } = await this.userCheckService.isCompetenceInOrganization(competenceId, parrent.id)

            await this.competenciesRepository.delete({
                id: +findCompetence.id,
            })

            return {
                id: +findCompetence.id,
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async getCompetenceSigns(user: UserPayload, competenceId: number): Promise<Sign[]> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const { findCompetence } = await this.userCheckService.isCompetenceInOrganization(competenceId, parrent.id)

            const signs = await this.signsRepository.find({
                where: {
                    competence: {
                        id: +findCompetence.id,
                    },
                },
                relations: ['criteria'],
            })

            return signs.map((item) => ({
                ...item,
                id: +item.id,
                criteria: item.criteria.map((el) => ({ ...el, id: +el.id })),
            }))
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async createSign(
        user: UserPayload,
        competenceId: number,
        body: CreateSignDto
    ): Promise<{
        id: number
        text: string
        criteria: {
            id: number
            text: string
            value: number
        }[]
        type: SignTypes
    }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const { findCompetence } = await this.userCheckService.isCompetenceInOrganization(competenceId, parrent.id)

            if (!body.criteria.length) throw new HttpException(constants.INCORRECT_DATA, HttpStatus.BAD_REQUEST)

            if (body.type === SignTypes.multi) {
                const getSum = body.criteria.map((item) => item.value).reduce((prev, next) => prev + next, 0)
                if (getSum !== 100) throw new HttpException(constants.INCORRECT_DATA, HttpStatus.BAD_REQUEST)
            }

            if (body.type === SignTypes.single) {
                let getMax = 0
                body.criteria.forEach((item) => {
                    if (item.value >= getMax) {
                        getMax = item.value
                    }
                })

                if (getMax !== 100) throw new HttpException(constants.INCORRECT_DATA, HttpStatus.BAD_REQUEST)
            }

            const newSign = new Sign()
            newSign.text = body.text
            newSign.type = body.type
            newSign.competence = findCompetence
            const createSign = await this.signsRepository.save(newSign)

            const newCriteriaArray: Criterion[] = body.criteria.map((item) => {
                const newCriterion = new Criterion()
                newCriterion.text = item.text
                newCriterion.value = item.value
                newCriterion.sign = createSign
                return newCriterion
            })

            await Promise.all(
                newCriteriaArray.map(async (criterion) => {
                    await this.criteriaRepository.save(criterion)
                })
            )

            const getNewSign = await this.signsRepository.findOne({
                where: {
                    id: newSign.id,
                },
                relations: ['criteria'],
            })

            if (!getNewSign) throw new HttpException(constants.SIGN_NOT_FOUND, HttpStatus.BAD_REQUEST)

            return {
                ...getNewSign,
                id: +getNewSign.id,
                criteria: getNewSign.criteria.map((item) => ({ ...item, id: +item.id })),
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async editSign(
        user: UserPayload,
        competenceId: number,
        body: EditSignDto
    ): Promise<{
        id: number
        text: string
        criteria: {
            id: number
            text: string
            value: number
        }[]
        type: SignTypes
    }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const { findSign } = await this.userCheckService.isSignInOrganization(body.id, parrent.id)

            if (!body.criteria.length) throw new HttpException(constants.INCORRECT_DATA, HttpStatus.BAD_REQUEST)

            if (body.type === SignTypes.multi) {
                const getSum = body.criteria.map((item) => item.value).reduce((prev, next) => prev + next, 0)
                if (getSum !== 100) throw new HttpException(constants.INCORRECT_DATA, HttpStatus.BAD_REQUEST)
            }

            if (body.type === SignTypes.single) {
                let getMax = 0
                body.criteria.forEach((item) => {
                    if (item.value >= getMax) {
                        getMax = item.value
                    }
                })

                if (getMax !== 100) throw new HttpException(constants.INCORRECT_DATA, HttpStatus.BAD_REQUEST)
            }

            const signDataToUpdate: {
                type?: SignTypes
                text?: string
            } = {}

            if (findSign.type !== body.type) {
                signDataToUpdate.type = body.type
            }

            if (findSign.text !== body.text) {
                signDataToUpdate.text = body.text
            }

            const criteriaToCreate = body.criteria.filter((item) => typeof item.id === 'string')
            const criteriaToUpdate = findSign.criteria
                .filter((item) =>
                    body.criteria
                        .filter((el) => typeof el.id !== 'string')
                        .map((el) => +el.id)
                        .includes(item.id)
                )
                .map((item) => {
                    const getItem = body.criteria.find((el) => el.id === item.id)
                    if (!getItem) return null
                    if (getItem.text !== item.text || getItem.value !== item.value) {
                        return getItem
                    }
                    return null
                })
                .filter((item) => item)

            const criteriaToDelete = findSign.criteria
                .filter(
                    (item) =>
                        !body.criteria
                            .filter((el) => typeof el.id !== 'string')
                            .map((el) => +el.id)
                            .includes(item.id)
                )
                .map((item) => item.id)

            if (Object.keys(signDataToUpdate).length) {
                await this.signsRepository.update(
                    {
                        id: findSign.id,
                    },
                    signDataToUpdate
                )
            }

            await Promise.all(
                criteriaToCreate.map(async (item) => {
                    const newCriterion = new Criterion()
                    newCriterion.sign = findSign
                    newCriterion.text = item.text
                    newCriterion.value = item.value
                    await this.criteriaRepository.save(newCriterion)
                })
            )

            await Promise.all(
                criteriaToUpdate.map(async (item) => {
                    await this.criteriaRepository.update(
                        { id: +item.id },
                        {
                            text: item.text,
                            value: item.value,
                        }
                    )
                })
            )

            await Promise.all(
                criteriaToDelete.map(async (item) => {
                    await this.criteriaRepository.delete({ id: +item })
                })
            )

            const getNewSign = await this.signsRepository.findOne({
                where: {
                    id: findSign.id,
                    competence: {
                        id: competenceId,
                    },
                },
                relations: ['criteria'],
            })

            if (!getNewSign) throw new HttpException(constants.SIGN_NOT_FOUND, HttpStatus.BAD_REQUEST)

            return {
                ...getNewSign,
                id: +getNewSign.id,
                criteria: getNewSign.criteria.map((item) => ({ ...item, id: +item.id })),
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async deleteSign(user: UserPayload, signId: number): Promise<{ id: number }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            await this.userCheckService.isSignInOrganization(signId, parrent.id)

            await this.signsRepository.delete({ id: signId })

            return { id: signId }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }
}
