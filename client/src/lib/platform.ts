import axios from 'axios';

/**
 * 独立部署版前端平台层（替代 @lark-apaas/client-toolkit）：
 * - logger：console 封装的日志器
 * - axiosForBackend：同源 API 请求实例（相对路径 /api/...）
 */

export const logger = {
  info: (...args: unknown[]) => console.info('[清爽书库]', ...args),
  warn: (...args: unknown[]) => console.warn('[清爽书库]', ...args),
  error: (...args: unknown[]) => console.error('[清爽书库]', ...args),
  debug: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.debug('[清爽书库]', ...args);
  },
};

export const axiosForBackend = axios.create({
  baseURL: '/',
  timeout: 120000,
});
