import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { Roles, User } from 'src/models/users.entitie'
import { CreateUserDto } from 'src/dto/createUser.dto'
import { InjectRepository } from '@nestjs/typeorm'
import * as sha256 from 'crypto-js/sha256'
import * as Base64 from 'crypto-js/enc-base64'
import { Repository } from 'typeorm'
import * as constants from '../constants'
import { UserConnection } from 'src/models/usersconnections.entitie'

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,

        @InjectRepository(User)
        private usersRepository: Repository<User>,

        @InjectRepository(UserConnection)
        private usersConnectionsRepository: Repository<UserConnection>
    ) {}

    async validateUser(username: string): Promise<User | null> {
        try {
            const user: User | undefined = await this.usersService.findOne(username)
            if (user) return user
            return null
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async login(user: any) {
        try {
            const payload = { email: user.email, id: user.id }
            return {
                access_token: this.jwtService.sign(payload),
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }

    async signUp(user: CreateUserDto): Promise<{ access_token: string }> {
        try {
            const findUser: User | undefined = await this.usersRepository.findOne({
                where: {
                    email: user.email,
                },
            })

            if (findUser) {
                throw new HttpException(constants.USER_EXISTS, HttpStatus.BAD_REQUEST)
            }

            const newUser = new User()

            newUser.email = user.email
            newUser.firstname = user.firstname
            newUser.middlename = user.middlename
            newUser.lastname = user.lastname
            newUser.organizationName = user.organizationName
            newUser.password = Base64.stringify(sha256(user.password))
            newUser.type = Roles.owner
            newUser.isActive = 1

            const createUser = await this.usersRepository.save(newUser)

            if (!createUser) {
                throw new HttpException(constants.USER_NOT_FOUND, HttpStatus.BAD_REQUEST)
            }

            const newConnection = new UserConnection()
            newConnection.adminUser = createUser
            newConnection.user = createUser

            await this.usersConnectionsRepository.save(newConnection)

            const payload = { email: createUser.email, id: createUser.id }

            return {
                access_token: this.jwtService.sign(payload),
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }
}
