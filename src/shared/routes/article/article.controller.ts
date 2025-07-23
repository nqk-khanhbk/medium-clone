import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ActiveUser } from '../../decorators/active-user.decorator';
import { AccessTokenGuard } from '../../guards/access-token.guard';
import { CreateArticleBodyDTO, DeleteArticleResDTO, GetArticleItemDTO, QueryArticlesDto, UpdateArticleDTO } from './article.dto';
import { FeedArticlesResponse } from '../../types/article.types';

@Controller('api/articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) { }

  @UseGuards(AccessTokenGuard)
  @Post()
  async createArticle(@Body() body: CreateArticleBodyDTO, @ActiveUser('userId') userId: number) {
    return new GetArticleItemDTO(await this.articleService.createArticle(body, userId))
  }

  @Get('/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return new GetArticleItemDTO(await this.articleService.findBySlug(slug))
  }

  @UseGuards(AccessTokenGuard)
  @Put('/:slug')
  async updateArticle(@Body() body: UpdateArticleDTO, @Param('slug') slug: string, @ActiveUser('userId') userId: number) {
    return new GetArticleItemDTO(await this.articleService.updateArticle(body, userId, slug))
  }

  @UseGuards(AccessTokenGuard)
  @Delete('/:slug')
  async deleteArticle(@Param('slug') slug: string, @ActiveUser('userId') userId: number) {
    return new DeleteArticleResDTO(await this.articleService.deleteArticle(userId, slug))
  }

  @UseGuards(AccessTokenGuard)
  @Post('/:slug/favorite')
  async favorite(@Param('slug') slug: string, @ActiveUser('userId') userId: number) {
    return (await this.articleService.favorite(userId, slug))
  }

  @UseGuards(AccessTokenGuard)
  @Post('/:slug/unfavorite')
  async unfavorite(@Param('slug') slug: string, @ActiveUser('userId') userId: number) {
    return (await this.articleService.unfavorite(userId, slug))
  }

  @Get()
  async listArticles(@Query() query:QueryArticlesDto){
    return this.articleService.listArticles(query)
  }

  @UseGuards(AccessTokenGuard)
  @Get('/feed')
  async feedArticles(@ActiveUser('userId') userId: number,@Query() query: QueryArticlesDto) {
    return this.articleService.feedArticles(userId, query);
  }
}
