import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterBodyDTO, LoginBodyDTO, LogoutResDTO, LogoutBodyDTO } from './auth.dto';

@Controller('api')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('users/register')
    async register(@Body() body: RegisterBodyDTO) {
        const result = await this.authService.register(body)
        return result
    }

    @Post('users/login')
    async login(@Body() body: LoginBodyDTO) {
        const result = await this.authService.login(body)
        return result
    }

    @Post('users/logout')
    async logout(@Body() body: LogoutBodyDTO) {
        return new LogoutResDTO(await this.authService.logout(body.refreshToken))
    }

}
