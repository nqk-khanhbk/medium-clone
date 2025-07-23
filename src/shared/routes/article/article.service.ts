import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateArticleBodyDTO, QueryArticlesDto, UpdateArticleDTO } from './article.dto';
import slugify from 'slugify'
import { Prisma } from '@prisma/client';
import { ArticleWithTagList, FeedArticlesResponse } from '../../types/article.types';

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

  async listArticles(query: QueryArticlesDto) {
    const { tag, author, favorited, limit, offset } = query;
    const where: any = {};

    try {
      if (tag) {
        const tagArray = tag.split(',').map((t) => t.trim()).filter(Boolean);

        // Lấy danh sách tag theo tên
        const tags = await this.prismaService.tag.findMany({
          where: {
            name: { in: tagArray },
          },
          select: { id: true },
        });

        const tagIds = tags.map((t) => t.id);

        if (tagIds.length) {
          // Lọc các bài viết có đủ tất cả các tag này
          where.AND = tagIds.map((tagId) => ({
            tags: {
              some: {
                tag_id: tagId,
              },
            },
          }));
        }
      }

      if (author) {
        const authorArray = author.split(',').map((auth) => auth.trim()).filter(Boolean);

        const authorUsers = await this.prismaService.user.findMany({
          where: { username: { in: authorArray } },
          select: { id: true },
        });

        if (authorUsers.length === 0) {
          return { articles: [], articlesCount: 0 };
        }

        const authorConditions = authorUsers.map((user) => ({
          author_id: user.id,
        }));

        where.OR = (where.OR || []).concat(authorConditions);
      }


      if (favorited) {
        const user = await this.prismaService.user.findUnique({
          where: { username: favorited },
          include: { favorites: true },
        });

        if (!user || user.favorites.length === 0) {
          return { articles: [], articlesCount: 0 };
        }

        where.id = {
          in: user.favorites.map((fav) => fav.article_id),
        };
      }

      const articles = await this.prismaService.article.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          tags: {
            include: {
              tag: {
                select: {
                  name: true,
                },
              },
            },
          },
          author: {
            select: {
              username: true,
              bio: true,
              image: true,
            },
          }
        },
        orderBy: { createdAt: 'desc' },
      });

      const articlesCount = await this.prismaService.article.count({ where });

      const formattedArticles = articles.map(({ tags, ...rest }) => ({
        ...rest,
        tagList: tags.map((t) => t.tag.name),
      }));

      return {
        articles: [...formattedArticles],
        articlesCount
      }
    } catch (error) {
      throw new Error('Không thể lấy danh sách bài viết. Vui lòng thử lại sau.');
    }
  }

  //phần xử lý lấy các bài viết của user mà người đăng nhập đã theo dõi
  async feedArticles(userId: number, query: QueryArticlesDto): Promise<FeedArticlesResponse> {
    const { limit, offset } = query;

    // Lấy danh sách user mà currentUser đang theo dõi
    try {
      const followees = await this.prismaService.follow.findMany({
        where: {
          followerId: userId,
        },
        select: {
          followeeId: true,
        },
      });

      const followeeIds = followees.map(f => f.followeeId);

      if (followeeIds.length === 0) {
        return {
          articles: [],
          articlesCount: 0,
          limit,
          offset,
        };
      }

      // Lấy bài viết từ những người đang theo dõi
      const [articles, articlesCount] = await Promise.all([
        this.prismaService.article.findMany({
          where: {
            author_id: {
              in: followeeIds,
            },
          },
          skip: offset,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            author: {
              select: {
                username: true,
                bio: true,
                image: true,
              },
            },
            tags: {
              select: {
                tag: {
                  select: { name: true },
                },
              },
            },
          },
        }),

        this.prismaService.article.count({
          where: {
            author_id: {
              in: followeeIds,
            },
          },
        }),
      ]);

      // Format lại tagList
      const formattedArticles: ArticleWithTagList[] = articles.map(({ tags, ...rest }) => ({
        ...rest,
        tagList: tags.map(t => t.tag.name),
        favorited: false,
      }));

      return {
        articles: formattedArticles,
        articlesCount,
        limit,
        offset,
      }
    } catch (error) {
      throw new Error('Không thể lấy bài viết từ người bạn theo dõi. Vui lòng thử lại sau.');
    }
  }
}

