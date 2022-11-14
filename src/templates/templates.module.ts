import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FormCompetence } from 'src/models/formCompetencies.entitie'
import { FormTemplate } from 'src/models/formTemplates.emtitie'
import { TemplatesController } from './templates.controller'
import { TemplatesService } from './templates.service'

@Module({
    imports: [TypeOrmModule.forFeature([FormTemplate, FormCompetence])],
    controllers: [TemplatesController],
    providers: [TemplatesService],
})
export class TemplatesModule {}
