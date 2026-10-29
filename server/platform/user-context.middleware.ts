import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

declare module 'express' {
  interface Request {
    /** 当前用户上下文（独立部署免登录，固定为 anonymous） */
    userContext?: { userId: string };
  }
}

/**
 * 注入请求级用户上下文（替代平台 UserContext 中间件）。
 * 免登录模式下固定为 anonymous；后续如需多用户，可在此扩展 token 解析。
 */
@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    req.userContext = { userId: 'anonymous' };
    next();
  }
}
