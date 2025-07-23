export class ArticleWithTagList {
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
  };
  tagList: string[];
}

export class FeedArticlesResponse {
  articles: ArticleWithTagList[];
  articlesCount: number;
  limit?: number;
  offset?: number;
}