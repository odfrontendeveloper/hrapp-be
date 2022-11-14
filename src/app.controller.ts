import { Controller, Post, UseGuards, Req, Body } from '@nestjs/common'
import { AppService } from './app.service'
import { LocalAuthGuard } from './auth/local-auth.guard'
import { AuthService } from './auth/auth.service'
import { CreateUserDto } from './dto/createUser.dto'

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post('auth')
    async login(@Req() req) {
        return this.authService.login(req.user)
    }

    @Post('signup')
    async signUp(@Body() body: CreateUserDto) {
        return this.authService.signUp(body)
    }
}
