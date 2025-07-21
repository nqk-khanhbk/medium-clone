import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ActiveUser } from '../../decorators/active-user.decorator';
import { AccessTokenGuard } from '../../guards/access-token.guard';
import { CreateArticleBodyDTO, GetArticleItemDTO, UpdateArticleDTO } from './article.dto';

@Controller('api')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) { }

  @UseGuards(AccessTokenGuard)
  @Post('articles')
  async createActicle(@Body() body: CreateArticleBodyDTO, @ActiveUser('userId') userId: number) {
    return new GetArticleItemDTO(await this.articleService.createActicle(body, userId))
  }

  @Get('articles/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return new GetArticleItemDTO(await this.articleService.findBySlug(slug))
  }

  @UseGuards(AccessTokenGuard)
  @Post('articles/:slug')
  async updateActicle(@Body() body: UpdateArticleDTO, @Param('slug') slug: string, @ActiveUser('userId') userId: number) {
    return new GetArticleItemDTO(await this.articleService.updateActicle(body, userId, slug))
  }

  @UseGuards(AccessTokenGuard)
  @Delete('articles/:slug')
  async deleteActicle(@Param('slug') slug: string, @ActiveUser('userId') userId: number) {
    return (await this.articleService.deleteActicle(userId, slug))
  }

  @UseGuards(AccessTokenGuard)
  @Post('articles/:slug/favorite')
  async favorite(@Param('slug') slug: string, @ActiveUser('userId') userId: number) {
    return (await this.articleService.favorite(userId, slug))
  }

  @UseGuards(AccessTokenGuard)
  @Post('articles/:slug/unfavorite')
  async unfavorite(@Param('slug') slug: string, @ActiveUser('userId') userId: number) {
    return (await this.articleService.unfavorite(userId, slug))
  }

}
