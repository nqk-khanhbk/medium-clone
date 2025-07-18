import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcrypt'
import { SALT_ROUNDS } from '../constants/auth.constant'

const saltRounds = SALT_ROUNDS

@Injectable()
export class HashingService {
  hash(value: string) {
    return hash(value, saltRounds)
  }

  compare(value: string, hash: string) {
    return compare(value, hash)
  }
}

