import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as constants from 'src/constants'
import { UserPayload } from 'src/dto/createUser.dto'
import { calcPaginate } from 'src/helpers/pagination'
import { Permissions } from 'src/models/permissions.entitie'
import { Position } from 'src/models/positions.entitie'
import { UserPosition } from 'src/models/userpositions.entitie'
import { Roles } from 'src/models/users.entitie'
import { UserCheckService } from 'src/user-check/user-check.service'
import { FindManyOptions, In, Like, Not, Repository } from 'typeorm'
import { CreatePositionDto } from './dto/positions.dto'

@Injectable()
export class PositionsService {
    constructor(
        private readonly userCheckService: UserCheckService,

        @InjectRepository(Position)
        private positionsRepository: Repository<Position>,

        @InjectRepository(UserPosition)
        private usersPositionsRepository: Repository<UserPosition>
    ) {}

    async getPositions(
        user: UserPayload,
        searchString: string,
        pageNumber: number
    ): Promise<{
        results: Position[]
        pagination: {
            totalPages: number
            page: number
        }
    }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const options = {
                where: {
                    user: {
                        id: parrent.id,
                    },
                    name: Like(`%${searchString}%`),
                },
            }

            const count: number = await this.positionsRepository.count(options)

            const { take, skip, totalPages, page } = calcPaginate(count, constants.GET_POSITIONS_PAGINATION, pageNumber)

            const findPositions = await this.positionsRepository.find({
                ...options,
                take,
                skip,
            })

            return {
                results: findPositions.map((item) => ({ ...item, id: +item.id })),
                pagination: {
                    page,
                    totalPages,
                },
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async getPositionsForFilters(
        user: UserPayload,
        searchString: string,
        pageNumber: number,
        selectedItems: string
    ): Promise<{
        selected: Position[]
        results: Position[]
        page: number
        hasMore: boolean
    }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_staff], permissions)

            const arrayOfSelectedIds = JSON.parse(selectedItems)

            const options: FindManyOptions<Position> = {
                order: {
                    name: 'ASC',
                },
                where: {
                    id: Not(In(arrayOfSelectedIds)),
                    user: {
                        id: parrent.id,
                    },
                    name: Like(`%${searchString}%`),
                },
            }

            const count: number = await this.positionsRepository.count(options)

            const { totalPages, page } = calcPaginate(count, constants.GET_POSITIONS_PAGINATION, pageNumber)

            const findPositions: Position[] = await this.positionsRepository.find({
                ...options,
                take: page * constants.GET_POSITIONS_PAGINATION,
            })

            const getSelectedItems: Position[] = await this.positionsRepository.find({
                ...options,
                where: {
                    id: In(arrayOfSelectedIds),
                },
            })

            return {
                selected: getSelectedItems.map((item) => ({ ...item, id: +item.id })),
                results: findPositions.map((item) => ({ ...item, id: +item.id })),
                page,
                hasMore: !!(page < totalPages),
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async createPosition(user: UserPayload, data: CreatePositionDto): Promise<{ created: true }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const findPosition = await this.positionsRepository.findOne({
                where: {
                    user: {
                        id: parrent.id,
                    },
                    name: data.name,
                },
            })

            if (findPosition) throw new HttpException(constants.POSITION_NAME_EXISTS, HttpStatus.BAD_REQUEST)

            const newPosition = new Position()
            newPosition.name = data.name
            newPosition.user = parrent
            await this.positionsRepository.save(newPosition)

            return { created: true }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async editPosition(user: UserPayload, id: number, data: CreatePositionDto): Promise<Position> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const findPosition = await this.positionsRepository.findOne({
                where: {
                    id,
                    user: {
                        id: parrent.id,
                    },
                },
            })

            if (!findPosition) throw new HttpException(constants.POSITION_NOT_FOUND, HttpStatus.BAD_REQUEST)

            await this.positionsRepository.update(
                {
                    id,
                },
                {
                    name: data.name,
                }
            )

            const findUpdatedPosition = await this.positionsRepository.findOne({
                where: {
                    id,
                    user: {
                        id: parrent.id,
                    },
                },
            })

            if (!findUpdatedPosition) throw new HttpException(constants.POSITION_NOT_FOUND, HttpStatus.BAD_REQUEST)

            return {
                ...findUpdatedPosition,
                id: +findUpdatedPosition.id,
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async deletePosition(user: UserPayload, id: number): Promise<{ deleted: true }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_forms], permissions)

            const findPosition = await this.positionsRepository.findOne({
                where: {
                    id,
                    user: {
                        id: parrent.id,
                    },
                },
            })

            if (!findPosition) throw new HttpException(constants.POSITION_NOT_FOUND, HttpStatus.BAD_REQUEST)

            const countOfConnections: number = await this.usersPositionsRepository.count({
                where: {
                    position: {
                        id: findPosition.id,
                    },
                },
            })

            if (countOfConnections)
                throw new HttpException(constants.POSITION_DELETE_BIND_USER_ERROR, HttpStatus.BAD_REQUEST)

            await this.positionsRepository.delete({
                id,
            })

            return { deleted: true }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }
}
