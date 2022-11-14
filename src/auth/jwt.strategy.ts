import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { jwtConstants } from './constants'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from 'src/models/users.entitie'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        })
    }

    async validate(payload: any) {
        try {
            const findUser = await this.usersRepository.findOne({
                where: {
                    id: payload.id,
                    isActive: 1,
                },
            })
            if (!findUser) {
                throw new UnauthorizedException()
            }
            return { id: +payload.id, email: payload.email }
        } catch {
            throw new UnauthorizedException()
        }
    }
}
