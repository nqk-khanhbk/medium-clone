import { IsString, Length, IsEmail, IsBoolean } from 'class-validator'
import { Exclude } from 'class-transformer'
import { Match } from 'src/shared/decorators/custom-validator.decorator'

export class LoginBodyDTO {
  @IsString()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string
  @IsString()
  @Length(6, 20, { message: 'Mật khẩu phải từ 6 đến 20 kí tự' })
  password: string
}

export class RegisterBodyDTO extends LoginBodyDTO {
  @IsString({ message: 'Tên phải là chuỗi' })
  username: string
}

export class RegisterResDTO {
  id: number
  email: string
  username: string
  @Exclude() password: string
  bio: string | null
  image: string | null
  accessToken: string
  refreshToken: string

  constructor(partial: Partial<RegisterResDTO>) {
    Object.assign(this, partial)
  }
}

export class LoginResDTO extends RegisterResDTO { }

export class LogoutBodyDTO {
  @IsString()
  refreshToken: string
}

export class LogoutResDTO {
  message: string
  constructor(partial: Partial<LogoutResDTO>) {
    Object.assign(this, partial)
  }
}

export class UpdateUserDTO {
  @IsString()
  email: string
  @IsString()
  bio: string
  @IsString()
  username: string
  @IsString()
  image: string
  @IsString()
  newPassword: string
  @IsString()
  @Match('newPassword', { message: 'Mật khẩu không khớp' })
  confirmNewPassword: string
}

export class GetProfileResDTO {
  @IsString()
  username: string
  @IsString()
  bio: string | null
  @IsString()
  image: string | null
  @IsBoolean()
  following: boolean

  constructor(partial: Partial<GetProfileResDTO>) {
    Object.assign(this, partial)
  }
}

export class FollowResDTO extends GetProfileResDTO { }

export class UnFollowResDTO extends GetProfileResDTO { }

