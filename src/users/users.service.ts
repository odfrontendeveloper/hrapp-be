import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Roles, User } from 'src/models/users.entitie'
import { FindManyOptions, FindOperator, In, Like, Repository } from 'typeorm'
import * as sha256 from 'crypto-js/sha256'
import * as Base64 from 'crypto-js/enc-base64'
import {
    CreateUserByAdminDto,
    UpdatePasswordDto,
    UpdateProfileDto,
    UpdateUserPasswordDto,
    UpdateUserPermissionsDto,
    UpdateUserProfileDto,
    UpdateUserTypeDto,
} from './dto/users.dto'
import * as constants from '../constants'
import { UserCheckService } from 'src/user-check/user-check.service'
import { UserPayload } from 'src/dto/createUser.dto'
import { UserConnection } from 'src/models/usersconnections.entitie'
import { Permission, Permissions } from 'src/models/permissions.entitie'
import { calcPaginate } from 'src/helpers/pagination'
import { Position } from 'src/models/positions.entitie'
import { UserPosition } from 'src/models/userpositions.entitie'

@Injectable()
export class UsersService {
    constructor(
        private readonly userCheckService: UserCheckService,

        @InjectRepository(User)
        private usersRepository: Repository<User>,

        @InjectRepository(UserConnection)
        private usersConnectionsRepository: Repository<UserConnection>,

        @InjectRepository(Permission)
        private usersPermissionsRepository: Repository<Permission>,

        @InjectRepository(UserPosition)
        private usersPositionsRepository: Repository<UserPosition>,

        @InjectRepository(Position)
        private positionsRepository: Repository<Position>
    ) {}

    async findOne(username: string): Promise<User> {
        try {
            const getUser = await this.usersRepository.findOne({
                where: {
                    email: username,
                    isActive: 1,
                },
            })

            if (!getUser) throw new HttpException(constants.USER_NOT_FOUND, HttpStatus.BAD_REQUEST)

            return getUser
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async getProfile(user: UserPayload): Promise<{
        id: number
        email: string
        firstname: string
        middlename: string
        lastname: string
        organizationName: string
        type: string
    }> {
        try {
            const { current } = await this.userCheckService.userDetails(user.id)

            if (!current) throw new HttpException(constants.USER_NOT_FOUND, HttpStatus.BAD_REQUEST)

            const data = {
                ...current,
                id: +current.id,
            }

            delete data.password
            delete data.isActive

            return data
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async updateProfile(
        user: UserPayload,
        data: UpdateProfileDto
    ): Promise<{
        id: number
        email: string
        firstname: string
        middlename: string
        lastname: string
        organizationName: string
        type: string
    }> {
        try {
            const { current, parrent } = await this.userCheckService.userDetails(user.id)

            const { email, firstname, middlename, lastname, organizationName } = data

            if (data.email !== current.email) {
                const findByEmail = await this.usersRepository.findOne({
                    where: {
                        email: data.email,
                    },
                })

                if (findByEmail) {
                    throw new HttpException(constants.USER_EXISTS, HttpStatus.BAD_REQUEST)
                }
            }

            const updateData = {
                email,
                firstname,
                middlename,
                lastname,
                organizationName,
            }

            if (current.type !== Roles.owner) {
                delete updateData.organizationName
            }

            await this.usersRepository.update(
                {
                    id: current.id,
                },
                updateData
            )

            const getUpdatedUser = await this.usersRepository.findOne({
                where: {
                    id: user.id,
                },
                select: ['id', 'email', 'firstname', 'middlename', 'lastname', 'organizationName', 'type'],
            })

            if (!getUpdatedUser) throw new HttpException(constants.USER_NOT_FOUND, HttpStatus.BAD_REQUEST)

            const returnData = {
                ...getUpdatedUser,
                id: +getUpdatedUser.id,
            }

            if (parrent) {
                returnData.organizationName = parrent.organizationName
            }

            return returnData
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async updatePassword(
        user: UserPayload,
        data: UpdatePasswordDto
    ): Promise<{
        success: true
    }> {
        try {
            const getUser = await this.usersRepository.findOne({
                where: {
                    email: user.email,
                },
            })

            if (!getUser) throw new HttpException(constants.USER_NOT_FOUND, HttpStatus.BAD_REQUEST)

            const { oldpassword, newpassword } = data

            if (Base64.stringify(sha256(oldpassword)) !== getUser.password) {
                throw new HttpException(constants.INCORRECT_PASSWORD, HttpStatus.BAD_REQUEST)
            }

            await this.usersRepository.update(
                {
                    id: getUser.id,
                },
                {
                    password: Base64.stringify(sha256(newpassword)),
                }
            )

            return { success: true }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async createUserByAdmin(
        user: UserPayload,
        data: CreateUserByAdminDto
    ): Promise<{
        id: number
        firstname: string
        middlename: string
        lastname: string
        email: string
        type: Roles
        permissions: Permissions[]
        positionInfo: Position | null
    }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_staff], permissions)

            const findUserByEmail: User | undefined = await this.usersRepository.findOne({
                where: {
                    email: data.email,
                },
            })

            if (findUserByEmail) {
                throw new HttpException(constants.USER_EXISTS, HttpStatus.BAD_REQUEST)
            }

            const newUser = new User()

            newUser.firstname = data.firstname
            newUser.middlename = data.middlename
            newUser.lastname = data.lastname
            newUser.organizationName = null
            newUser.email = data.email
            newUser.password = Base64.stringify(sha256(data.password))
            newUser.isActive = 1
            newUser.type = Roles.staff

            const createdUser: User | undefined = await this.usersRepository.save(newUser)

            if (!createdUser) {
                throw new HttpException(constants.USER_NOT_FOUND, HttpStatus.BAD_REQUEST)
            }

            const newConnection = new UserConnection()

            newConnection.adminUser = parrent
            newConnection.user = createdUser

            await this.usersConnectionsRepository.save(newConnection)

            return {
                id: +createdUser.id,
                firstname: createdUser.firstname,
                middlename: createdUser.middlename,
                lastname: createdUser.lastname,
                email: createdUser.email,
                type: createdUser.type,
                permissions: [],
                positionInfo: null,
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async getOrganizationUsers(
        user: UserPayload,
        searchValue: string,
        pageNumber: number,
        active: string,
        types: string,
        positions: string
    ): Promise<{
        results: {
            id: number
            firstname: string
            middlename: string
            lastname: string
            email: string
            type: Roles
            permissions: Permission[]
            isActive: 1 | 0
            positionInfo: Position | null
        }[]
        pagination: {
            totalPages: number
            page: number
        }
    }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_staff], permissions)

            const additionalOptions: {
                isActive?: number
                type?: FindOperator<Roles[]>
                id?: FindOperator<number[]>
            } = {}

            const activeList: string[] = JSON.parse(active)
            const typesList: Roles[] = JSON.parse(types)
            const positionsList: number[] = JSON.parse(positions)

            if (activeList.length === 1) {
                additionalOptions.isActive = activeList[0] === 'yes' ? 1 : 0
            }

            if (typesList.length) {
                additionalOptions.type = In(typesList)
            }

            if (positionsList.length) {
                const getPositionsConnections = await this.usersPositionsRepository.find({
                    where: {
                        position: {
                            id: In(positionsList),
                        },
                    },
                    relations: ['user'],
                })

                const ids = getPositionsConnections.map((item) => +item.user.id)

                additionalOptions.id = In(ids)
            }

            const options: any = {
                where: ['email', 'firstname', 'middlename', 'lastname'].map((field) => ({
                    adminUser: {
                        id: parrent.id,
                    },
                    user: {
                        [field]: Like(`%${searchValue}%`),
                        ...additionalOptions,
                    },
                })),
                relations: ['user'],
                select: ['user'],
            }

            const countOfUsers: number = await this.usersConnectionsRepository.count(options)

            const { take, skip, totalPages, page } = calcPaginate(countOfUsers, 10, pageNumber)

            const getUsersConnections: UserConnection[] = await this.usersConnectionsRepository.find({
                ...options,
                take,
                skip,
            })

            const usersIds = getUsersConnections.map((userData) => userData.user.id)

            const getUsers = await this.usersRepository.find({
                where: {
                    id: In(usersIds),
                },
                relations: ['permissions', 'userPosition'],
                select: ['id', 'firstname', 'middlename', 'lastname', 'email', 'type', 'permissions', 'isActive'],
            })

            const listOfIds = getUsers.filter((user) => user.userPosition).map((user) => +user.userPosition.id)

            const getPositionsConnections: UserPosition[] = await this.usersPositionsRepository.find({
                where: {
                    id: In(listOfIds),
                },
                relations: ['position'],
            })

            return {
                results: getUsers.map((item) => ({
                    id: +item.id,
                    firstname: item.firstname,
                    middlename: item.middlename,
                    lastname: item.lastname,
                    email: item.email,
                    type: item.type,
                    permissions: item.permissions,
                    isActive: item.isActive,
                    positionInfo: item.userPosition
                        ? getPositionsConnections.find((el) => +el.id === +item.userPosition.id)
                            ? {
                                  ...getPositionsConnections.find((el) => +el.id === +item.userPosition.id).position,
                                  id: +getPositionsConnections.find((el) => +el.id === +item.userPosition.id).position
                                      .id,
                              }
                            : null
                        : null,
                })),
                pagination: {
                    page,
                    totalPages,
                },
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async updateUserPassword(user: UserPayload, data: UpdateUserPasswordDto): Promise<{ updated: true }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_staff], permissions)

            const { userId, newPassword } = data

            const { findUser } = await this.userCheckService.isUserInOrganization(userId, parrent)

            if (findUser.type === Roles.owner) {
                throw new ForbiddenException()
            }

            await this.usersRepository.update(
                {
                    id: userId,
                },
                {
                    password: Base64.stringify(sha256(newPassword)),
                }
            )

            return { updated: true }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async updateUserProfile(
        user: UserPayload,
        data: UpdateUserProfileDto
    ): Promise<User & { positionInfo: Position | null }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_staff], permissions)

            const { userId, firstname, middlename, lastname, email, isActive } = data

            const { findUser } = await this.userCheckService.isUserInOrganization(userId, parrent)

            if (findUser.type === Roles.owner) {
                throw new ForbiddenException()
            }

            if (findUser.email !== email) {
                const findByEmail = await this.usersRepository.findOne({
                    where: {
                        email,
                    },
                })

                if (findByEmail) {
                    throw new HttpException(constants.USER_EXISTS, HttpStatus.BAD_REQUEST)
                }
            }

            await this.usersRepository.update(
                {
                    id: userId,
                },
                {
                    firstname,
                    middlename,
                    lastname,
                    email,
                    isActive,
                }
            )

            const { findUser: findUpdatedUser } = await this.userCheckService.isUserInOrganization(userId, parrent)

            return findUpdatedUser
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async updateUserType(
        user: UserPayload,
        data: UpdateUserTypeDto
    ): Promise<User & { positionInfo: Position | null }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_staff], permissions)

            const { type, userId } = data

            const { findUser } = await this.userCheckService.isUserInOrganization(userId, parrent)

            if (findUser.type === Roles.owner) {
                throw new ForbiddenException()
            }

            await this.usersRepository.update(
                {
                    id: userId,
                },
                {
                    type,
                }
            )

            if (type === Roles.staff) {
                await this.usersPermissionsRepository.delete({
                    user: {
                        id: userId,
                    },
                })
            }

            const { findUser: findUpdatedUser } = await this.userCheckService.isUserInOrganization(userId, parrent)

            return findUpdatedUser
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async updateUserPermissions(
        user: UserPayload,
        data: UpdateUserPermissionsDto
    ): Promise<User & { positionInfo: Position | null }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_staff], permissions)

            const { permissions: permissionsToSet, userId } = data

            const { findUser } = await this.userCheckService.isUserInOrganization(userId, parrent)

            if (findUser.type !== Roles.admin) {
                throw new ForbiddenException()
            }

            const userPermissionsAsArray: Permissions[] = findUser.permissions.map((permission) => permission.type)

            const toRemove: Permissions[] = userPermissionsAsArray.filter((item) => !permissionsToSet.includes(item))
            const toAdd: Permissions[] = permissionsToSet.filter((item) => !userPermissionsAsArray.includes(item))

            await this.usersPermissionsRepository.delete({
                user: {
                    id: findUser.id,
                },
                type: In(toRemove),
            })

            const entitiesToAdd = toAdd.map((permissionName) => {
                const newPermission = new Permission()
                newPermission.user = findUser
                newPermission.type = permissionName
                return newPermission
            })

            await Promise.all(
                entitiesToAdd.map(async (item) => {
                    const newPermission = await this.usersPermissionsRepository.save(item)
                    return newPermission
                })
            )

            const { findUser: findUpdatedUser } = await this.userCheckService.isUserInOrganization(userId, parrent)

            return findUpdatedUser
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async setUserPosition(
        user: UserPayload,
        userId: number,
        positionId: number
    ): Promise<User & { positionInfo: Position | null }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_staff], permissions)
            const { findUser, positionConnection } = await this.userCheckService.isUserInOrganization(userId, parrent)

            if (positionId === 0) {
                await this.usersPositionsRepository.delete({
                    user: {
                        id: findUser.id,
                    },
                })

                const { findUser: findUpdatedUser } = await this.userCheckService.isUserInOrganization(userId, parrent)

                return findUpdatedUser
            }

            const findPosition: Position | undefined = await this.positionsRepository.findOne({
                where: {
                    id: positionId,
                    user: {
                        id: parrent.id,
                    },
                },
            })

            if (!findPosition) throw new HttpException(constants.POSITION_NOT_FOUND, HttpStatus.BAD_REQUEST)

            if (positionConnection) {
                await this.usersPositionsRepository.update(
                    {
                        id: positionConnection.id,
                    },
                    {
                        position: findPosition,
                    }
                )
            } else {
                const newPositionConnection = await new UserPosition()
                newPositionConnection.user = findUser
                newPositionConnection.position = findPosition
                await this.usersPositionsRepository.save(newPositionConnection)
            }

            const { findUser: findUpdatedUser } = await this.userCheckService.isUserInOrganization(userId, parrent)

            return findUpdatedUser
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async deleteUser(user: UserPayload, userId: number): Promise<{ deleted: true }> {
        try {
            const { current, permissions, parrent } = await this.userCheckService.userDetails(user.id)
            this.userCheckService.requireUserType([Roles.owner, Roles.admin], current.type)
            this.userCheckService.requirePermissions([Permissions.can_manage_staff], permissions)

            if (+userId === +parrent.id) {
                throw new ForbiddenException()
            }

            const { findUser } = await this.userCheckService.isUserInOrganization(userId, parrent)

            await this.usersRepository.delete({
                id: +findUser.id,
            })

            return { deleted: true }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }
}
