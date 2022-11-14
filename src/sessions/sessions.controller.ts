import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { PositionIdDto } from 'src/templates/dto/templates.dto'
import { PageNumberDto, SearchValueDto } from 'src/users/dto/users.dto'
import { ICreateSession, IdDto, IEditSession, SendFormBody } from './dto/sessions.dto'
import { SessionsService } from './sessions.service'

@Controller('sessions')
export class SessionsController {
    constructor(private sessionsService: SessionsService) {}

    @UseGuards(JwtAuthGuard)
    @Get('users')
    getUsers(@Req() req, @Query() query: SearchValueDto & PageNumberDto) {
        return this.sessionsService.getUsersForAssessment(req.user, query.searchString, +query.page)
    }

    @UseGuards(JwtAuthGuard)
    @Get('forms/:positionId')
    getForms(@Req() req, @Param() { positionId }: PositionIdDto) {
        return this.sessionsService.getFormsForPosition(req.user, +positionId)
    }

    @UseGuards(JwtAuthGuard)
    @Get('')
    getSessions(@Req() req, @Query() query: SearchValueDto & PageNumberDto) {
        return this.sessionsService.getSessions(req.user, query.searchString, +query.page)
    }

    @UseGuards(JwtAuthGuard)
    @Post('create')
    createSession(@Req() req, @Body() body: ICreateSession) {
        return this.sessionsService.createNewSession(req.user, body)
    }

    @UseGuards(JwtAuthGuard)
    @Put('session/:id')
    editSession(@Req() req, @Body() body: IEditSession, @Param() { id }: IdDto) {
        return this.sessionsService.editSession(req.user, body, +id)
    }

    @UseGuards(JwtAuthGuard)
    @Delete('session/:id')
    deleteSession(@Req() req, @Param() { id }: IdDto) {
        return this.sessionsService.deleteSession(req.user, +id)
    }

    @UseGuards(JwtAuthGuard)
    @Get('invitations')
    getUserInvitations(@Req() req) {
        return this.sessionsService.getInvitations(req.user)
    }

    @UseGuards(JwtAuthGuard)
    @Get('invitations/:id')
    getUserInvitation(@Req() req, @Param() { id }: IdDto) {
        return this.sessionsService.getInvitation(req.user, +id)
    }

    @UseGuards(JwtAuthGuard)
    @Post('sendform')
    sendForm(@Req() req, @Body() body: SendFormBody) {
        return this.sessionsService.sendForm(req.user, body)
    }

    @UseGuards(JwtAuthGuard)
    @Get('details/:id')
    getDetails(@Req() req, @Param() { id }: IdDto) {
        return this.sessionsService.getSessionDetails(req.user, +id)
    }
}
