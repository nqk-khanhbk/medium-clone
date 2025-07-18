import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { HashingService } from 'src/shared/services/hashing.service';
import { Prisma } from '@prisma/client';
import { UpdateUserDTO } from '../auth/auth.dto';
import { NotFoundException } from '@nestjs/common';


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
                    id: userId
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    bio: true,
                    image: true
                }
            })
            const tokens = await this.prismaService.refreshToken.findUnique({
                where: {
                    userId: userId
                },
                select: {
                    token: true
                }
            })
            return {
                ...user,
                ...tokens
            }
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException('Không tìm thấy user!')
            }
            throw error
        }
    }

    async updateUser({ userId, body }: { userId: number, body: UpdateUserDTO }) {
        try {
            const data: any = {
                email: body.email,
                bio: body.bio,
                username: body.username,
                image: body.image
            };

            if (body.newPassword) {
                const hashedPassword = await this.hashingService.hash(body.newPassword)
                data.password = hashedPassword;
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
                    image: true
                }
            })
            const tokens = await this.prismaService.refreshToken.findUnique({
                where: {
                    userId: userId
                },
                select: {
                    token: true
                }
            })
            return {
                ...user,
                ...tokens
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
        });
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng!');
        }
        // 2. Kiểm tra người đó có đang follow mình không
        const follow = await this.prismaService.follow.findUnique({
            where: {
                followerId_followeeId: {
                    followerId: user.id,       // người kia
                    followeeId: currentUserId, // mình
                },
            },
        });
        const isFollowingYou = !!follow;
        return {
            username: user.username,
            bio: user.bio,
            image: user.image,
            following: isFollowingYou, //người kia có đang follow mình?
        };
    }
}
