/**
 * 中间件系统
 *
 * 用于组合和复用 API 路由逻辑
 *
 * @example 基本使用
 * ```ts
 * import { compose, withErrorHandling, withAuth } from '@/lib/middleware';
 * import { apiOk } from '@/lib/api/response';
 *
 * export const GET = compose(
 *   withErrorHandling(),
 *   withAuth(),
 *   async (request) => {
 *     const session = request.context.session;
 *     return apiOk({ userId: session.userId });
 *   }
 * );
 * ```
 *
 * @example 角色权限检查
 * ```ts
 * export const DELETE = compose(
 *   withErrorHandling(),
 *   withAuth(),
 *   withRoleCheck('admin'),
 *   async (request) => {
 *     // 只有 admin 可以访问
 *   }
 * );
 * ```
 *
 * @example 限流保护
 * ```ts
 * export const POST = compose(
 *   withErrorHandling(),
 *   withRateLimit(),
 *   async (request) => {
 *     const ip = request.context.ip;
 *     // 自动检查IP限流
 *   }
 * );
 * ```
 */

// 核心
export { compose, withContext, getClientIp } from './core';

// 认证相关
export { withErrorHandling, withAuth, withRoleCheck } from './auth';

// 工具类
export { withRateLimit, withLogging } from './utils';

// 类型导出
export type {
  Middleware,
  RouteHandler,
  RequestWithContext,
  RequestContext,
  ErrorResponse,
  MiddlewareOptions,
} from './types';
