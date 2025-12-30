import { NextRequest, NextResponse } from 'next/server';
import type { SessionData } from '@/lib/auth/types';
import type { ApiErrorResponse } from '@/lib/api/response';

/**
 * 扩展的请求上下文，用于在中间件间传递数据
 */
export interface RequestContext {
  /** 会话数据（由 withAuth 注入） */
  session?: SessionData;
  /** 客户端IP地址 */
  ip?: string;
  /** 请求开始时间戳（用于日志） */
  startTime?: number;
  /** 请求方法（GET/POST等） */
  method?: string;
  /** 请求路径 */
  path?: string;
  /** 其他自定义数据 */
  [key: string]: unknown;
}

/**
 * 扩展的 NextRequest，包含上下文
 */
export interface RequestWithContext extends NextRequest {
  context: RequestContext;
}

/**
 * 路由处理器类型
 */
export type RouteHandler = (
  request: RequestWithContext
) => Promise<NextResponse>;

/**
 * 中间件类型：接收一个处理器，返回一个新的处理器
 */
export type Middleware = (handler: RouteHandler) => RouteHandler;

/**
 * 标准化的错误响应
 */
export type ErrorResponse = ApiErrorResponse<unknown>;

/**
 * 中间件配置选项
 */
export interface MiddlewareOptions {
  /** 是否启用请求日志 */
  enableLogging?: boolean;
  /** 自定义错误处理 */
  errorHandler?: (error: unknown) => NextResponse;
}
