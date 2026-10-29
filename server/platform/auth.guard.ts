import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { NEED_LOGIN_KEY } from './need-login.decorator';

/**
 * 全局鉴权守卫（替代平台登录守卫）：
 * - 默认免登录模式：未配置 ADMIN_TOKEN 时所有请求放行；
 * - 配置 ADMIN_TOKEN 后：带 @NeedLogin 的写操作要求请求头 x-auth-token 匹配。
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const needLogin =
      this.reflector.getAllAndOverride<boolean>(NEED_LOGIN_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (!needLogin) return true;

    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = (req.headers['x-auth-token'] as string) || '';
    if (token !== adminToken) {
      throw new UnauthorizedException('访问口令不正确');
    }
    return true;
  }
}
