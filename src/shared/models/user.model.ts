import { Exclude } from 'class-transformer'

export class UserModel {
  id: number
  username: string
  email: string
  @Exclude() password: string
  bio: string | null
  image: string | null
  createdAt: Date
  updatedAt: Date

  constructor(partial: Partial<UserModel>) {
    Object.assign(this, partial)
  }
}
