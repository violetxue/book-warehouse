import { Global, Module } from '@nestjs/common';
import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DRIZZLE_DATABASE } from './database.constants';
import * as schema from '@server/database/schema';

/**
 * 独立部署数据库模块：使用 postgres-js 驱动连接 PostgreSQL，通过 Drizzle ORM 提供类型安全的数据库访问。
 * 替代平台 @lark-apaas/fullstack-nestjs-core 提供的数据库注入。
 */
@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DATABASE,
      useFactory: (): PostgresJsDatabase<typeof schema> => {
        const connectionString =
          process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/book_warehouse';
        const client = postgres(connectionString, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
          onnotice: () => {},
        });
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE_DATABASE],
})
export class DatabaseModule {}
