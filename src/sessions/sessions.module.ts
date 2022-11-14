import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Competence } from 'src/models/competencies.entitie'
import { Criterion } from 'src/models/criteria.entitie'
import { FormCompetence } from 'src/models/formCompetencies.entitie'
import { FormTemplate } from 'src/models/formTemplates.emtitie'
import { Position } from 'src/models/positions.entitie'
import { SessionInvitation } from 'src/models/sessioninvitations.entitie'
import { Session } from 'src/models/sessions.entitie'
import { Sign } from 'src/models/signs.entitie'
import { UserPosition } from 'src/models/userpositions.entitie'
import { User } from 'src/models/users.entitie'
import { UserConnection } from 'src/models/usersconnections.entitie'
import { SessionsController } from './sessions.controller'
import { SessionsService } from './sessions.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Session,
            User,
            Position,
            UserPosition,
            UserConnection,
            FormTemplate,
            Competence,
            FormCompetence,
            Sign,
            Criterion,
            SessionInvitation,
        ]),
    ],
    controllers: [SessionsController],
    providers: [SessionsService],
})
export class SessionsModule {}
