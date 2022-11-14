import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { CompetenciesService } from './competencies.service'
import {
    CreateCompetenceDto,
    CompetenceIdDto,
    EditCompetenceDto,
    GetCompetenciesDto,
    CreateSignDto,
    EditSignDto,
    SignIdDto,
} from './dto/competencies.dto'

@Controller('competencies')
export class CompetenciesController {
    constructor(private competenciesService: CompetenciesService) {}

    @UseGuards(JwtAuthGuard)
    @Get('position/:positionId')
    getPositionCompetencies(@Req() { user }, @Param() { positionId }: GetCompetenciesDto) {
        return this.competenciesService.getPositionCompetencies(user, +positionId)
    }

    @UseGuards(JwtAuthGuard)
    @Post('position/create')
    createPositionCompetence(@Req() { user }, @Body() body: CreateCompetenceDto) {
        return this.competenciesService.createPoitionCompetence(user, body)
    }

    @UseGuards(JwtAuthGuard)
    @Put('position/edit')
    editPositionCompetence(@Req() { user }, @Body() body: EditCompetenceDto) {
        return this.competenciesService.editPositionCompetence(user, body)
    }

    @UseGuards(JwtAuthGuard)
    @Delete('position/:competenceId')
    deletePositionCompetence(@Req() { user }, @Param() { competenceId }: CompetenceIdDto) {
        return this.competenciesService.deletePositionCompetence(user, +competenceId)
    }

    @UseGuards(JwtAuthGuard)
    @Get('competence/:competenceId/signs')
    getCompetenceSigns(@Req() { user }, @Param() { competenceId }: CompetenceIdDto) {
        return this.competenciesService.getCompetenceSigns(user, +competenceId)
    }

    @UseGuards(JwtAuthGuard)
    @Post('competence/:competenceId/createSign')
    createSign(@Req() { user }, @Param() { competenceId }: CompetenceIdDto, @Body() body: CreateSignDto) {
        return this.competenciesService.createSign(user, +competenceId, body)
    }

    @UseGuards(JwtAuthGuard)
    @Put('competence/:competenceId/editSign')
    editSign(@Req() { user }, @Param() { competenceId }: CompetenceIdDto, @Body() body: EditSignDto) {
        return this.competenciesService.editSign(user, +competenceId, body)
    }

    @UseGuards(JwtAuthGuard)
    @Delete('sign/:signId/deleteSign')
    deleteSign(@Req() { user }, @Param() { signId }: SignIdDto) {
        return this.competenciesService.deleteSign(user, +signId)
    }
}
