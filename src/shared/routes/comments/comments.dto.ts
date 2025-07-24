import { IsNotEmpty, IsString } from "class-validator";

export class AuthorDTO {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export class CommentDto {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
  };
}

export class CommentResDto {
  comments: CommentDto[];

  constructor(partial: Partial<CommentResDto>) {
    Object.assign(this, partial);
  }
}

export class CreateCommentDTO {
  @IsString()
  @IsNotEmpty()
  body: string;
}

export class CommentResDTO {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: AuthorDTO;

  constructor(partial: Partial<CommentResDTO>) {
    Object.assign(this, partial);
  }
}

export class DeleteResDTO {
  message: string;


  constructor(partial: Partial<DeleteResDTO>) {
    Object.assign(this, partial);
  }

}