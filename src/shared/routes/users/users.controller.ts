import { UpdateUserDTO, GetProfileResDTO, FollowResDTO, UnFollowResDTO } from '../auth/auth.dto'
import { Controller, Get, Param, Put, UseGuards, Body,Post, Delete} from '@nestjs/common'
import { UsersService } from './users.service'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@Controller('api')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  @UseGuards(AccessTokenGuard)
  @Post('profiles/:username/follow')
  async follow(@Param('username') username: string, @ActiveUser('userId') currentUserId: number) {
    return new FollowResDTO(await this.usersService.follow(username, currentUserId))
  }

  @UseGuards(AccessTokenGuard)
  @Delete('profiles/:username/unfollow')
  async unfollow(@Param('username') username: string, @ActiveUser('userId') currentUserId: number) {
    return new UnFollowResDTO(await this.usersService.unfollow(username, currentUserId))
  }

}
