import { NextRequest, NextResponse } from 'next/server';
import type {
  Middleware,
  RouteHandler,
  RequestWithContext,
  RequestContext,
} from './types';

/**
 * 为 NextRequest 添加上下文
 */
export function withContext(request: NextRequest): RequestWithContext {
  const contextRequest = request as RequestWithContext;
  if (!contextRequest.context) {
    contextRequest.context = {} as RequestContext;
  }
  // 提供稳定的请求元信息，避免日志中出现 undefined
  if (!contextRequest.context.method) {
    contextRequest.context.method = request.method;
  }
  if (!contextRequest.context.path) {
    contextRequest.context.path = new URL(request.url).pathname;
  }
  if (!contextRequest.context.ip) {
    contextRequest.context.ip = getClientIp(request);
  }
  return contextRequest;
}

/**
 * 组合多个中间件
 * @param middlewares 中间件数组（从左到右执行）
 * @returns 组合后的路由处理器（符合 Next.js 要求）
 *
 * @example
 * const handler = compose(
 *   withErrorHandling(),
 *   withAuth(),
 *   async (request) => { ... }
 * );
 */
export function compose(
  ...middlewares: (Middleware | RouteHandler)[]
): (request: NextRequest) => Promise<NextResponse> {
  if (middlewares.length === 0) {
    throw new Error('compose requires at least one middleware or handler');
  }

  // 最后一个应该是实际的处理器
  const lastItem = middlewares[middlewares.length - 1];
  const handler = lastItem as RouteHandler;
  const middlewareList = middlewares.slice(0, -1) as Middleware[];

  // 构建处理器：先添加上下文，再应用中间件
  const wrappedHandler: RouteHandler = async (request: NextRequest) => {
    const reqWithContext = withContext(request);
    return handler(reqWithContext);
  };

  // 从右到左应用中间件（洋葱模型）
  const finalHandler = middlewareList.reduceRight(
    (next, middleware) => middleware(next),
    wrappedHandler
  );

  // 返回符合 Next.js 签名的函数
  return async (request: NextRequest) => {
    const reqWithContext = withContext(request);
    return finalHandler(reqWithContext);
  };
}

/**
 * 辅助函数：从请求中获取客户端IP
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
