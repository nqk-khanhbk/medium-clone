import { ClassSerializerInterceptor, Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SharedModule } from './shared/shared.module'
import { AuthModule } from './shared/routes/auth/auth.module'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { UsersModule } from './shared/routes/users/users.module'
import { ArticleModule } from './shared/routes/article/article.module'

@Module({
  imports: [SharedModule, AuthModule, UsersModule,ArticleModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
