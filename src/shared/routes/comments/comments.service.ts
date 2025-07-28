import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentDto, CommentResDTO, CreateCommentDTO, DeleteResDTO } from './comments.dto';
import { PrismaService } from '../../services/prisma.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prismaService: PrismaService,
  ) { }

  async createComment(userId: number, slug: string, dto: CreateCommentDTO): Promise<CommentResDTO> {
    // 1. Tìm article theo slug
    const article = await this.prismaService.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // 2. Tạo comment
    const comment = await this.prismaService.comment.create({
      data: {
        body: dto.body,
        article_id: article.id,
        author_id: userId,
      },
      include: {
        author: true,
      },
    });

    // 3. Kiểm tra follow
    let following = false;

    if (userId !== article.author_id) {
      const followRecord = await this.prismaService.follow.findUnique({
        where: {
          followerId_followeeId: {
            followerId: userId,
            followeeId: article.author_id,
          },
        },
      });

      following = !!followRecord;
    }

    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following,
      },
    };
  }

  async deleteComment(slug: string, commentId: number, userId: number): Promise<DeleteResDTO> {
    try {
      // 1. Tìm bài viết theo slug
      const article = await this.prismaService.article.findUnique({
        where: { slug },
      });

      if (!article) {
        throw new NotFoundException('Article not found');
      }

      // 2. Tìm comment theo id
      const comment = await this.prismaService.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment || comment.article_id !== article.id) {
        throw new NotFoundException('Comment not found in this article');
      }

      // 3. Kiểm tra quyền xóa (chỉ author của comment mới được xóa)
      if (comment.author_id !== userId) {
        throw new ForbiddenException('You are not allowed to delete this comment');
      }

      // 4. Xóa comment
      await this.prismaService.comment.delete({
        where: { id: commentId },
      });

      // 5. Trả về kết quả
      return { message: 'Comment deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  async getComments(slug: string): Promise<CommentDto[]> {
    try {
      // 1. Tìm bài viết theo slug
      const article = await this.prismaService.article.findUnique({
        where: { slug },
      });

      if (!article) {
        throw new NotFoundException('Article not found');
      }

      // 2. Lấy danh sách comment theo article_id
      const comments = await this.prismaService.comment.findMany({
        where: {
          article_id: article.id,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              bio: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: {
          username: comment.author.username,
          bio: comment.author.bio,
          image: comment.author.image,
        },
      }));
    }
    catch (error) {
      throw error;
    }
  }
}
