import { Strategy } from 'passport-local'
import { PassportStrategy } from '@nestjs/passport'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import * as sha256 from 'crypto-js/sha256'
import * as Base64 from 'crypto-js/enc-base64'
import { AuthService } from './auth.service'
import * as constants from '../constants'
import { User } from 'src/models/users.entitie'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({ usernameField: 'email' })
    }

    async validate(email: string, password: string): Promise<User> {
        const user: User | null = await this.authService.validateUser(email)
        if (!user) {
            throw new HttpException(constants.USER_NOT_FOUND, HttpStatus.BAD_REQUEST)
        }
        if (user.password !== Base64.stringify(sha256(password))) {
            throw new HttpException(constants.INCORRECT_PASSWORD, HttpStatus.BAD_REQUEST)
        }
        return user
    }
}
