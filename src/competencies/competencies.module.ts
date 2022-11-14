import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Competence } from 'src/models/competencies.entitie'
import { Sign } from 'src/models/signs.entitie'
import { Position } from 'src/models/positions.entitie'
import { User } from 'src/models/users.entitie'
import { CompetenciesController } from './competencies.controller'
import { CompetenciesService } from './competencies.service'
import { Criterion } from 'src/models/criteria.entitie'

@Module({
    imports: [TypeOrmModule.forFeature([User, Position, Competence, Sign, Criterion])],
    controllers: [CompetenciesController],
    providers: [CompetenciesService],
})
export class CompetenciesModule {}
