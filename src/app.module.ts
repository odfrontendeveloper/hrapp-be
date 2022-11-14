import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './models/users.entitie'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { UserCheckModule } from './user-check/user-check.module'
import { UserConnection } from './models/usersconnections.entitie'
import { Permission } from './models/permissions.entitie'
import { PositionsModule } from './positions/positions.module'
import { Position } from './models/positions.entitie'
import { UserPosition } from './models/userpositions.entitie'
import { Competence } from './models/competencies.entitie'
import { CompetenciesModule } from './competencies/competencies.module'
import { Sign } from './models/signs.entitie'
import { Criterion } from './models/criteria.entitie'
import { FormTemplate } from './models/formTemplates.emtitie'
import { TemplatesModule } from './templates/templates.module'
import { FormCompetence } from './models/formCompetencies.entitie'
import { Session } from './models/sessions.entitie'
import { SessionsModule } from './sessions/sessions.module'
import { SessionInvitation } from './models/sessioninvitations.entitie'

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: '11111111',
            database: 'hr360',
            entities: [
                User,
                UserConnection,
                Permission,
                Position,
                UserPosition,
                Competence,
                Sign,
                Criterion,
                FormTemplate,
                FormCompetence,
                Session,
                SessionInvitation,
            ],
            synchronize: true,
        }),
        AuthModule,
        UsersModule,
        UserCheckModule,
        UserCheckModule,
        PositionsModule,
        CompetenciesModule,
        TemplatesModule,
        SessionsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
