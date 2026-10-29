import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';
import type { NextFunction, Request, Response } from 'express';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

/** 启动时检测数据库连通性，失败仅告警（接口调用时才真正报错） */
async function checkDatabase(logger: Logger): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/book_warehouse';
  let client: ReturnType<typeof postgres> | null = null;
  try {
    client = postgres(connectionString, { max: 1, connect_timeout: 5 });
    await client`SELECT 1`;
    logger.log('数据库连接正常');
  } catch (error) {
    logger.warn(
      `无法连接数据库（${(error as Error)?.message ?? error}）。` +
        '请确认 PostgreSQL 已启动、数据库已创建并已执行 npm run db:init。',
    );
  } finally {
    if (client) await client.end().catch(() => {});
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: process.env.NODE_ENV !== 'development',
  });

  // 跨域：允许任意来源（网站要分享给他人，手机/电脑浏览器直接访问）
  app.enableCors({ origin: true, credentials: true });

  // 上传文件静态访问：/api/files/<存储名>
  const uploadDir = join(process.cwd(), process.env.UPLOAD_DIR || 'data/uploads');
  app.useStaticAssets(uploadDir, { prefix: '/api/files/' });

  // 生产模式：静态托管前端构建产物（dist/client）
  const clientDist = join(process.cwd(), 'dist/client');
  const indexFile = join(clientDist, 'index.html');
  if (existsSync(indexFile)) {
    app.useStaticAssets(clientDist);
    // SPA fallback：非 /api 的 GET 请求返回 index.html（刷新任意前端路由不 404）
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) return next();
      if (req.method === 'GET' && existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }
      return next();
    });
  }

  const logger = new Logger('Bootstrap');
  const host = process.env.SERVER_HOST || '0.0.0.0';
  const port = Number(process.env.SERVER_PORT || '3000');

  await app.listen(port, host);
  logger.log(`Book Warehouse running on http://${host}:${port}`);
  logger.log(`API endpoints ready at http://${host}:${port}/api`);
  await checkDatabase(logger);
}

bootstrap();
