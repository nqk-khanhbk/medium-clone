import { IsArray, IsString, ArrayNotEmpty, ArrayUnique } from "class-validator";
import { ArticleModel } from "../../models/article.model";
import { Type } from "class-transformer";
import { UserModel } from "../../models/user.model";

export class GetArticleItemDTO extends ArticleModel {
  @Type(() => UserModel)
  author: Omit<UserModel, 'password'>

  constructor(partial: Partial<GetArticleItemDTO>) {
    super(partial)
    Object.assign(this, partial)
  }
}

export class CreateArticleBodyDTO {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  body: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  tagList: string[];
}

export class UpdateArticleDTO extends CreateArticleBodyDTO{}
