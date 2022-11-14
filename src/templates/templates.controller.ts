import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { CompetenceIdDto } from 'src/competencies/dto/competencies.dto'
import { CreateTemplateDto, PositionIdDto, TemplateIdDto } from './dto/templates.dto'
import { TemplatesService } from './templates.service'

@Controller('templates')
export class TemplatesController {
    constructor(private templatesService: TemplatesService) {}

    @UseGuards(JwtAuthGuard)
    @Get(':positionId')
    getPositionTemplates(@Req() { user }, @Param() { positionId }: PositionIdDto) {
        return this.templatesService.getPositionTemplates(user, +positionId)
    }

    @UseGuards(JwtAuthGuard)
    @Post(':positionId')
    createPositionTemplate(@Req() { user }, @Param() { positionId }: PositionIdDto, @Body() body: CreateTemplateDto) {
        return this.templatesService.createTemplate(user, +positionId, body)
    }

    @UseGuards(JwtAuthGuard)
    @Put(':positionId/edit/:templateId')
    editPositionTemplate(
        @Req() { user },
        @Param() { positionId, templateId }: PositionIdDto & TemplateIdDto,
        @Body() body: CreateTemplateDto
    ) {
        return this.templatesService.editTemplate(user, +positionId, +templateId, body)
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':templateId')
    deletePositionTemplate(@Req() { user }, @Param() { templateId }: TemplateIdDto) {
        return this.templatesService.deleteTemplate(user, +templateId)
    }

    @UseGuards(JwtAuthGuard)
    @Put('connection')
    editConnection(@Req() { user }, @Query() { templateId, competenceId }: TemplateIdDto & CompetenceIdDto) {
        return this.templatesService.editConnection(user, +templateId, +competenceId)
    }
}
