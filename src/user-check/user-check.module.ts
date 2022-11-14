import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Competence } from 'src/models/competencies.entitie'
import { FormTemplate } from 'src/models/formTemplates.emtitie'
import { Position } from 'src/models/positions.entitie'
import { Sign } from 'src/models/signs.entitie'
import { UserPosition } from 'src/models/userpositions.entitie'
import { User } from 'src/models/users.entitie'
import { UserConnection } from 'src/models/usersconnections.entitie'
import { UserCheckService } from './user-check.service'

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([User, UserConnection, UserPosition, Position, Competence, Sign, FormTemplate])],
    controllers: [],
    providers: [UserCheckService],
    exports: [UserCheckService],
})
export class UserCheckModule {}
