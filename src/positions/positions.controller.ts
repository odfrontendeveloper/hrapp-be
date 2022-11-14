import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { StringIdDto } from 'src/dto/createUser.dto'
import { PageNumberDto, SearchValueDto } from 'src/users/dto/users.dto'
import { CreatePositionDto, SelectedPositionsDto } from './dto/positions.dto'
import { PositionsService } from './positions.service'

@Controller('positions')
export class PositionsController {
    constructor(private positionsService: PositionsService) {}

    @UseGuards(JwtAuthGuard)
    @Get('')
    getPositions(@Req() req: { user }, @Query() query: SearchValueDto & PageNumberDto) {
        return this.positionsService.getPositions(req.user, query.searchString || '', +query.page)
    }

    @UseGuards(JwtAuthGuard)
    @Get('filters')
    getPositionsFilters(@Req() req: { user }, @Query() query: SearchValueDto & PageNumberDto & SelectedPositionsDto) {
        return this.positionsService.getPositionsForFilters(
            req.user,
            query.searchString || '',
            +query.page,
            query.selected
        )
    }

    @UseGuards(JwtAuthGuard)
    @Post('')
    createPosition(@Req() req: { user }, @Body() body: CreatePositionDto) {
        return this.positionsService.createPosition(req.user, body)
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    editPosition(@Req() req: { user }, @Body() body: CreatePositionDto, @Param() params: StringIdDto) {
        return this.positionsService.editPosition(req.user, +params.id, body)
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    deletePosition(@Req() req: { user }, @Param() params: StringIdDto) {
        return this.positionsService.deletePosition(req.user, +params.id)
    }
}
