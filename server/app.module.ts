import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { DatabaseModule } from './platform/database.module';
import { StorageModule } from './platform/storage.module';
import { AuthGuard } from './platform/auth.guard';
import { UserContextMiddleware } from './platform/user-context.middleware';
import { BooksModule } from './modules/books/books.module';
import { FoldersModule } from './modules/folders/folders.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [DatabaseModule, StorageModule, BooksModule, FoldersModule, FilesModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserContextMiddleware).forRoutes('*');
  }
}
