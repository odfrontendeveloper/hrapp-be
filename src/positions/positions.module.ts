import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Position } from 'src/models/positions.entitie'
import { UserPosition } from 'src/models/userpositions.entitie'
import { PositionsController } from './positions.controller'
import { PositionsService } from './positions.service'

@Module({
    imports: [TypeOrmModule.forFeature([Position, UserPosition])],
    controllers: [PositionsController],
    providers: [PositionsService],
})
export class PositionsModule {}
