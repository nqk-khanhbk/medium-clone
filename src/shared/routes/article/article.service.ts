import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateArticleBodyDTO, UpdateArticleDTO } from './article.dto';
import slugify from 'slugify'

@Injectable()
export class ArticleService {
  constructor(private readonly prismaService: PrismaService) { }

  async createActicle(body: CreateArticleBodyDTO, userId: number) {
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

  async updateActicle(body: UpdateArticleDTO, userId: number, slug: string) {
    const { title, description, body: content, tagList } = body

    const existingArticle = await this.prismaService.article.findUnique({
      where: { slug },
      include: { tags: true },
    })

    if (!existingArticle) {
      throw new NotFoundException('Article not found')
    }

    if (existingArticle.author_id !== userId) {
      throw new ForbiddenException('You are not the author of this article')
    }

    const newSlug = slugify(title, { lower: true, strict: true })

    if (newSlug !== slug) {
      const slugExists = await this.prismaService.article.findUnique({
        where: { slug: newSlug },
      })

      if (slugExists) {
        throw new BadRequestException('Slug already exists for another article')
      }
    }

    // Xử lý tags
    const tags = await Promise.all(
      tagList.map(async (tagName) => {
        return this.prismaService.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        })
      })
    )

    // Xóa các tag cũ liên kết với article
    await this.prismaService.articleTag.deleteMany({
      where: { article_id: existingArticle.id },
    })

    // Cập nhật bài viết
    const updatedArticle = await this.prismaService.article.update({
      where: { id: existingArticle.id },
      data: {
        title,
        description,
        body: content,
        slug: newSlug,
        tags: {
          create: tags.map((tag) => ({
            tag: { connect: { id: tag.id } },
          })),
        },
      },
      include: {
        author: true,
        favorites: true,
      },
    })

    return {
      ...updatedArticle,
      tagList: tags.map((tag) => tag.name),
      favorited: false,
      favoritesCount: updatedArticle.favorites.length,
    }
  }

  async deleteActicle(userId: number, slug: string) {
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

    return { message: 'Article deleted successfully' };
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
      article: {
        ...updatedArticle,
        favorited: true,
      },
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
      article: {
        ...updatedArticle,
        favorited: false,
      },
    };
  }



}

