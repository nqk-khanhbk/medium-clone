import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ActiveUser } from '../../decorators/active-user.decorator';
import { AccessTokenGuard } from '../../guards/access-token.guard';
import { CreateArticleBodyDTO, DeleteArticleResDTO, GetArticleItemDTO, UpdateArticleDTO } from './article.dto';

@Controller('api')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) { }

  @UseGuards(AccessTokenGuard)
  @Post('articles')
  async createArticle(@Body() body: CreateArticleBodyDTO, @ActiveUser('userId') userId: number) {
    return new GetArticleItemDTO(await this.articleService.createArticle(body, userId))
  }

  @Get('articles/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return new GetArticleItemDTO(await this.articleService.findBySlug(slug))
  }

  @UseGuards(AccessTokenGuard)
  @Put('articles/:slug')
  async updateArticle(@Body() bodyupdate: UpdateArticleDTO, @Param('slug') slug: string, @ActiveUser('userId') userId: number) {
    return new GetArticleItemDTO(await this.articleService.updateArticle(bodyupdate, userId, slug))
  }

  @UseGuards(AccessTokenGuard)
  @Delete('articles/:slug')
  async deleteArticle(@Param('slug') slug: string, @ActiveUser('userId') userId: number) {
    return new DeleteArticleResDTO(await this.articleService.deleteArticle(userId, slug))
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
