import { SetMetadata } from '@nestjs/common';

export const NEED_LOGIN_KEY = 'needLogin';

/**
 * 标记接口需要鉴权（行为由 AuthGuard 决定）：
 * - 未配置 ADMIN_TOKEN 时：免登录模式，直接放行（默认，满足"任何人可访问"）
 * - 配置 ADMIN_TOKEN 后：需请求头携带 x-auth-token 且与 ADMIN_TOKEN 一致
 */
export const NeedLogin = () => SetMetadata(NEED_LOGIN_KEY, true);
