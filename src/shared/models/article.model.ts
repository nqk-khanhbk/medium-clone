export class ArticleModel {
  id: number
  slug: string
  title: string
  description: string
  body: string
  authorId: number
  createdAt: Date
  updatedAt: Date
  tagList: string[];

  constructor(partial: Partial<ArticleModel>) {
    Object.assign(this, partial)
  }
}
