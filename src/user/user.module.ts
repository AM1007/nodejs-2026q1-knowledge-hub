import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ArticleModule } from '../article/article.module';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [forwardRef(() => ArticleModule), forwardRef(() => CommentModule)],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
