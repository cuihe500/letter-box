import { checkRateLimit } from '@/lib/auth/rate-limit';
import { apiError } from '@/lib/api/response';
import type { Middleware, RouteHandler } from './types';
import { withContext, getClientIp } from './core';

/**
 * IP 限流中间件
 * 检查客户端 IP 是否被限流（登录失败次数过多）
 *
 * @example
 * const handler = compose(
 *   withErrorHandling(),
 *   withRateLimit(),
 *   async (request) => {
 *     const ip = request.context.ip; // 获取客户端IP
 *     // ...
 *   }
 * );
 */
export function withRateLimit(): Middleware {
  return (handler: RouteHandler): RouteHandler => {
    return async (request) => {
      const reqWithContext = withContext(request);

      // 获取客户端 IP
      const ip = getClientIp(request);
      reqWithContext.context.ip = ip;

      // 检查限流
      const rateLimit = await checkRateLimit(ip);
      if (!rateLimit.allowed) {
        return apiError('ACCOUNT_LOCKED', {
          status: 429,
          message: '登录失败次数过多，账户已锁定',
          data: { lockedUntil: rateLimit.lockedUntil?.toISOString() ?? null },
        });
      }

      // 将剩余尝试次数注入上下文（可选）
      if (rateLimit.remainingAttempts !== undefined) {
        reqWithContext.context.remainingAttempts = rateLimit.remainingAttempts;
      }

      return handler(reqWithContext);
    };
  };
}

/**
 * 请求日志中间件
 * 记录请求的方法、路径、耗时等信息
 *
 * @param options 日志配置选项
 *
 * @example
 * const handler = compose(
 *   withLogging({ verbose: true }),
 *   withErrorHandling(),
 *   async (request) => { ... }
 * );
 */
export function withLogging(options?: { verbose?: boolean }): Middleware {
  const verbose = options?.verbose ?? false;

  return (handler: RouteHandler): RouteHandler => {
    return async (request) => {
      const reqWithContext = withContext(request);

      // 记录请求开始时间和基本信息
      const startTime = Date.now();
      reqWithContext.context.startTime = startTime;

      const method = request.method;
      const path = new URL(request.url).pathname;
      const ip = getClientIp(request);

      // 注入到上下文，供其他中间件和日志函数使用
      reqWithContext.context.ip = ip;
      reqWithContext.context.method = method;
      reqWithContext.context.path = path;

      try {
        // 执行处理器
        const response = await handler(reqWithContext);

        // 计算耗时并记录请求日志
        const duration = Date.now() - startTime;

        console.log(
          `${method} ${path} ${response.status} ${duration}ms`,
          {
            ip,
            userId: reqWithContext.context.session?.userId,
            ...(verbose ? { role: reqWithContext.context.session?.role } : {}),
          }
        );

        return response;
      } catch (error) {
        // 记录错误日志
        console.error('请求错误', {
          method,
          path,
          ip,
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    };
  };
}
