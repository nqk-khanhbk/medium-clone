import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { AccessTokenGuard } from '../../guards/access-token.guard';
import { ActiveUser } from '../../decorators/active-user.decorator';
import {  CommentResDto, CommentResDTO, CreateCommentDTO, DeleteResDTO } from './comments.dto';

@Controller('api/articles/:slug/comments')

export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @UseGuards(AccessTokenGuard)
  @Post()
  async createComment(@ActiveUser('userId') userId: number, @Param('slug') slug: string, @Body() body: CreateCommentDTO) {
    return new CommentResDTO(await this.commentsService.createComment(userId, slug, body));
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  async deleteComment(@ActiveUser('userId') userId: number, @Param('slug') slug: string, @Param('id') id: number) {
    return new DeleteResDTO(await this.commentsService.deleteComment(slug, id, userId));
  }

  @Get()
  async getComments(@Param('slug') slug: string): Promise<CommentResDto> {
    const comments = await this.commentsService.getComments(slug);
    return new CommentResDto({comments});
  }
}
