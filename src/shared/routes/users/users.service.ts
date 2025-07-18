import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { Prisma } from '@prisma/client'
import { UpdateUserDTO } from '../auth/auth.dto'
import { NotFoundException } from '@nestjs/common'

@Injectable()
export class UsersService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prismaService: PrismaService,
  ) { }
  async currentUser(userId: number) {
    try {
      const user = await this.prismaService.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
        select: {
          id: true,
          email: true,
          username: true,
          bio: true,
          image: true,
        },
      })
      const tokens = await this.prismaService.refreshToken.findUnique({
        where: {
          userId: userId,
        },
        select: {
          token: true,
        },
      })
      return {
        ...user,
        ...tokens,
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy user!')
      }
      throw error
    }
  }

  async updateUser({ userId, body }: { userId: number; body: UpdateUserDTO }) {
    try {
      const data: any = {
        email: body.email,
        bio: body.bio,
        username: body.username,
        image: body.image,
      }

      if (body.newPassword) {
        const hashedPassword = await this.hashingService.hash(body.newPassword)
        data.password = hashedPassword
      }

      const user = await this.prismaService.user.update({
        where: {
          id: userId,
        },
        data,
        select: {
          id: true,
          email: true,
          username: true,
          bio: true,
          image: true,
        },
      })
      const tokens = await this.prismaService.refreshToken.findUnique({
        where: {
          userId: userId,
        },
        select: {
          token: true,
        },
      })
      return {
        ...user,
        ...tokens,
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy user!')
      }
      throw error
    }
  }

  async getProfile(username: string, currentUserId: number) {
    // 1. Tìm user theo username (người mình muốn xem)
    const user = await this.prismaService.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        image: true,
      },
    })
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng!')
    }
    // 2. Kiểm tra người đó có đang follow mình không
    const follow = await this.prismaService.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId: user.id, // người kia
          followeeId: currentUserId, // mình
        },
      },
    })
    const isFollowingYou = !!follow
    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: isFollowingYou, //người kia có đang follow mình?
    }
  }

  async follow(username: string, currentUserId: number) {
    // Tìm người dùng cần được follow
    const userToFollow = await this.prismaService.user.findUnique({
      where: {
        username: username
      },
    });

    if (!userToFollow) {
      throw new NotFoundException('Không tìm thấy người mình muốn follow!');
    }

    // Không cho phép tự follow chính mình
    if (userToFollow.id === currentUserId) {
      throw new BadRequestException('Không thể follow chính bản thân mình!');
    }

    // Kiểm tra xem đã follow chưa
    const existingFollow = await this.prismaService.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId: currentUserId,
          followeeId: userToFollow.id,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('Bạn đã follow người này rồi!');
    }

    // Nếu chưa follow thì thêm follow
    if (!existingFollow) {
      await this.prismaService.follow.create({
        data: {
          followerId: currentUserId,
          followeeId: userToFollow.id,
        },
      });
    }

    return {
      username: userToFollow.username,
      bio: userToFollow.bio,
      image: userToFollow.image,
      following: true,
    };
  }

  async unfollow(username: string, currentUserId: number) {
    const userToUnfollow = await this.prismaService.user.findUnique({
      where: { username },
    });

    if (!userToUnfollow) {
      throw new NotFoundException('Không tìm thấy người bạn muốn unfollow!');
    }

    if (userToUnfollow.id === currentUserId) {
      throw new BadRequestException('Không thể unfollow chính bản thân mình!');
    }

    const existingFollow = await this.prismaService.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId: currentUserId,
          followeeId: userToUnfollow.id,
        },
      },
    });

    if (!existingFollow) {
      throw new BadRequestException('Bạn chưa follow người này,hãy gửi follow!');
    }

    await this.prismaService.follow.delete({
      where: {
        followerId_followeeId: {
          followerId: currentUserId,
          followeeId: userToUnfollow.id,
        },
      },
    });

    return {
      username: userToUnfollow.username,
      bio: userToUnfollow.bio,
      image: userToUnfollow.image,
      following: false,
    };
  }


}
