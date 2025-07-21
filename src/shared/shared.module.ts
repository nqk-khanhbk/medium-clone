import { Global, Module } from '@nestjs/common'
import { PrismaService } from './services/prisma.service'
import { HashingService } from './services/hashing.service'
import { TokenService } from './services/token.services'
import { JwtModule } from '@nestjs/jwt'
import { ArticleModule } from './routes/article/article.module';

const sharedServices = [PrismaService, HashingService, TokenService]
@Global()
@Module({
  providers: sharedServices,
  exports: sharedServices,
  imports: [JwtModule, ArticleModule],
})
export class SharedModule {}
