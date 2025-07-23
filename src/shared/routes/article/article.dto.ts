import { IsArray, IsString, ArrayNotEmpty, ArrayUnique, IsOptional, IsNotEmpty, IsInt, Min } from "class-validator";
import { ArticleModel } from "../../models/article.model";
import { Type } from "class-transformer";
import { UserModel } from "../../models/user.model";
import { LIMIT_DEFAULT, OFFSET_DEFAULT } from "../../constants/articles.constant";

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

export class UpdateArticleDTO{
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  body?: string;
}

export class DeleteArticleResDTO{
  status:boolean
  message: string
  constructor(partial: Partial<DeleteArticleResDTO>) {
    Object.assign(this, partial)
  }
}

export class QueryArticlesDto {
  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  favorited?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  limit?: number = LIMIT_DEFAULT;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = OFFSET_DEFAULT;
}
