import { Body, Controller, Delete, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { StringIdDto } from 'src/dto/createUser.dto'
import {
    CreateUserByAdminDto,
    GetUsersParamsDto,
    PageNumberDto,
    SearchValueDto,
    SetUserPositionDto,
    UpdatePasswordDto,
    UpdateProfileDto,
    UpdateUserPasswordDto,
    UpdateUserPermissionsDto,
    UpdateUserProfileDto,
    UpdateUserTypeDto,
} from './dto/users.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Req() req: { user }) {
        return this.usersService.getProfile(req.user)
    }

    @UseGuards(JwtAuthGuard)
    @Put('profile')
    changeProfile(@Req() req: { user }, @Body() body: UpdateProfileDto) {
        return this.usersService.updateProfile(req.user, body)
    }

    @UseGuards(JwtAuthGuard)
    @Put('password')
    changePassword(@Req() req: { user }, @Body() body: UpdatePasswordDto) {
        return this.usersService.updatePassword(req.user, body)
    }

    @UseGuards(JwtAuthGuard)
    @Post('createUser')
    createUserByAdmin(@Req() req: { user }, @Body() body: CreateUserByAdminDto) {
        return this.usersService.createUserByAdmin(req.user, body)
    }

    @UseGuards(JwtAuthGuard)
    @Get('adminUsers')
    getAdminUsers(@Req() req: { user }, @Query() query: SearchValueDto & PageNumberDto & GetUsersParamsDto) {
        return this.usersService.getOrganizationUsers(
            req.user,
            query.searchString || '',
            +query.page,
            query.active,
            query.types,
            query.positions
        )
    }

    @UseGuards(JwtAuthGuard)
    @Put('staff/password')
    changeUserPassword(@Req() req: { user }, @Body() body: UpdateUserPasswordDto) {
        return this.usersService.updateUserPassword(req.user, body)
    }

    @UseGuards(JwtAuthGuard)
    @Put('staff/profile')
    changeUserProfile(@Req() req: { user }, @Body() body: UpdateUserProfileDto) {
        return this.usersService.updateUserProfile(req.user, body)
    }

    @UseGuards(JwtAuthGuard)
    @Put('staff/type')
    changeUserType(@Req() req: { user }, @Body() body: UpdateUserTypeDto) {
        return this.usersService.updateUserType(req.user, body)
    }

    @UseGuards(JwtAuthGuard)
    @Put('staff/permissions')
    changeUserPermissions(@Req() req: { user }, @Body() body: UpdateUserPermissionsDto) {
        return this.usersService.updateUserPermissions(req.user, body)
    }

    @UseGuards(JwtAuthGuard)
    @Put('staff/position')
    setUserPosition(@Req() req: { user }, @Body() body: SetUserPositionDto) {
        return this.usersService.setUserPosition(req.user, body.userId, body.positionId)
    }

    @UseGuards(JwtAuthGuard)
    @Delete('staff/delete')
    deleteUser(@Req() req: { user }, @Query() query: StringIdDto) {
        return this.usersService.deleteUser(req.user, +query.id)
    }
}
