import { UpdateUserDTO,GetProfileResDTO } from '../auth/auth.dto';
import { Controller, Get, Param, Put, UseGuards, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator';

@Controller('api')
export class UsersController {
    constructor(private readonly usersService:UsersService){}

    @UseGuards(AccessTokenGuard)
    @Get('user')
    async currentUser(@ActiveUser('userId') userId: number) {
        return this.usersService.currentUser(userId)
    }

    @UseGuards(AccessTokenGuard)
    @Put('user')
    async updateUser(@Body() body: UpdateUserDTO, @ActiveUser('userId') userId: number) {
        return this.usersService.updateUser({ userId, body })
    }

    @UseGuards(AccessTokenGuard)
    @Get('profiles/:username')
    async getProfile(@Param('username') username: string, @ActiveUser('userId') currentUserId: number) {
        return new GetProfileResDTO(await this.usersService.getProfile(username, currentUserId))
    }

}
