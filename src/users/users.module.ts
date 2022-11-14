import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from 'src/models/users.entitie'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { UserConnection } from 'src/models/usersconnections.entitie'
import { Permission } from 'src/models/permissions.entitie'
import { Position } from 'src/models/positions.entitie'
import { UserPosition } from 'src/models/userpositions.entitie'

@Module({
    imports: [TypeOrmModule.forFeature([User, UserConnection, Permission, Position, UserPosition])],
    providers: [UsersService],
    exports: [UsersService],
    controllers: [UsersController],
})
export class UsersModule {}
