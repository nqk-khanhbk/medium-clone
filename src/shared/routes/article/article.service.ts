import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateArticleBodyDTO, UpdateArticleDTO } from './article.dto';
import slugify from 'slugify'
import { Prisma } from '@prisma/client';

@Injectable()
export class ArticleService {
  constructor(private readonly prismaService: PrismaService) { }

  async createArticle(body: CreateArticleBodyDTO, userId: number) {
    const { title, description, body: content, tagList } = body

    const slug = slugify(title, { lower: true, strict: true })
    const existingArticle = await this.prismaService.article.findUnique({
      where: { slug },
    })

    if (existingArticle) {
      throw new ConflictException('Slug already exists')
    }
    // Tìm hoặc tạo tag
    const tags = await Promise.all(
      tagList.map(async (tagName) => {
        return this.prismaService.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        })
      })
    )

    // Tạo bài viết
    const article = await this.prismaService.article.create({
      data: {
        slug,
        title,
        description,
        body: content,
        author_id: userId,
        tags: {
          create: tags.map((tag) => ({
            tag: {
              connect: { id: tag.id },
            },
          })),
        },
      },
      include: {
        author: true,
        favorites: true,
      },
    })

    // Lấy danh sách tên tag
    const tagListResult = tags?.map((tag) => tag.name) ?? []

    return {
      ...article,
      tagList: tagListResult,
      favorited: false,
      favoritesCount: article.favorites.length,
    }
  }

  async findBySlug(slug: string) {
    const article = await this.prismaService.article.findUnique({
      where: { slug },
      include: {
        author: {
          omit: {
            password: true
          }
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with slug '${slug}' not found`);
    }

    return article;
  }

  async updateArticle(bodyupdate: UpdateArticleDTO, userId: number, slug: string) {
    const { title, description, body } = bodyupdate;

    if (!title && !description && !body) {
      throw new BadRequestException('Phải có ít nhất một trường được cập nhật');
    }

    const article = await this.prismaService.article.findUnique({
      where: { slug },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!article) {
      throw new BadRequestException('Bài viết không tồn tại');
    }

    if (article.author_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa bài viết này');
    }

    const updateData: any = {};

    if (title) {
      const newSlug = slugify(title, { lower: true, strict: true });
      const existed = await this.prismaService.article.findUnique({
        where: { slug: newSlug },
      });

      if (existed && existed.id !== article.id) {
        throw new BadRequestException('Tiêu đề bài viết đã tồn tại');
      }

      updateData.title = title;
      updateData.slug = newSlug;
    }

    if (description) updateData.description = description;
    if (body) updateData.body = body;

    const updatedArticle = await this.prismaService.article.update({
      where: { id: article.id },
      data: updateData,
      include: {
        author: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    const tagList = article.tags.map(t => t.tag.name);
    // Trả về kết quả
    return {
      ...updatedArticle,
      tagList,
      tags: undefined,
    };
  }


  async deleteArticle(userId: number, slug: string) {
    const article = await this.prismaService.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.author_id !== userId) {
      throw new ForbiddenException('You are not the author of this article');
    }

    await this.prismaService.article.delete({
      where: { slug },
    });

    return { status: true, message: 'Article deleted successfully' };
  }


  async favorite(userId: number, slug: string) {
    const article = await this.prismaService.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Kiểm tra xem người dùng đã yêu thích bài viết chưa
    const isFavorited = await this.prismaService.favorite.findUnique({
      where: {
        user_id_article_id: {
          user_id: userId,
          article_id: article.id,
        },
      },
    });

    if (isFavorited) {
      throw new BadRequestException('You have already favorited this article');
    }

    // Thêm vào bảng yêu thích
    await this.prismaService.favorite.create({
      data: {
        user_id: userId,
        article_id: article.id,
      },
    });

    const favoritesCount = await this.prismaService.favorite.count({
      where: {
        article_id: article.id
      },
    });

    const updatedArticle = await this.prismaService.article.update({
      where: {
        id: article.id
      },
      data: {
        favoritesCount
      },
      include: {
        author: {
          omit: {
            password: true
          }
        }
      },
    });

    return {
      ...updatedArticle,
      favorited: true,
    };
  }

  async unfavorite(userId: number, slug: string) {
    const article = await this.prismaService.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const isFavorited = await this.prismaService.favorite.findUnique({
      where: {
        user_id_article_id: {
          user_id: userId,
          article_id: article.id,
        },
      },
    });

    if (!isFavorited) {
      throw new BadRequestException('You have not favorited this article');
    }

    // Xóa khỏi bảng yêu thích
    await this.prismaService.favorite.delete({
      where: {
        user_id_article_id: {
          user_id: userId,
          article_id: article.id,
        },
      },
    });

    // Cập nhật lại số lượng yêu thích
    const favoritesCount = await this.prismaService.favorite.count({
      where: { article_id: article.id },
    });

    const updatedArticle = await this.prismaService.article.update({
      where: { id: article.id },
      data: { favoritesCount },
      include: {
        author: {
          omit: {
            password: true
          }
        },
      },
    });

    return {
      ...updatedArticle,
      favorited: false,
    };
  }
}

