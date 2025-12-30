import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api/response';
import type { Middleware, RouteHandler } from './types';
import type { UserRole } from '@/lib/auth/types';
import { withContext } from './core';

type LoggedError = Error & { logged?: true };

/**
 * 统一错误处理中间件
 * 捕获所有错误并返回标准化的错误响应
 */
export function withErrorHandling(): Middleware {
  return (handler: RouteHandler): RouteHandler => {
    return async (request) => {
      const reqWithContext = withContext(request);

      try {
        return await handler(reqWithContext);
      } catch (error) {
        const method =
          reqWithContext.context.method ?? reqWithContext.method ?? 'UNKNOWN';
        const path =
          reqWithContext.context.path ??
          (() => {
            try {
              return new URL(reqWithContext.url).pathname;
            } catch {
              return 'UNKNOWN';
            }
          })();
        const ip = reqWithContext.context.ip ?? 'unknown';
        const userId = reqWithContext.context.session?.userId;

        const isLogged =
          error instanceof Error && (error as LoggedError).logged === true;

        if (!isLogged) {
          const knownErrorCodes = new Set([
            'UNAUTHORIZED',
            'FORBIDDEN',
            'NOT_FOUND',
            'BAD_REQUEST',
          ]);

          if (error instanceof Error && knownErrorCodes.has(error.message)) {
            console.warn('请求失败', {
              code: error.message,
              method,
              path,
              ip,
              ...(userId ? { userId } : {}),
            });
          } else {
            console.error('请求错误', {
              method,
              path,
              ip,
              ...(userId ? { userId } : {}),
              error:
                error instanceof Error
                  ? { name: error.name, message: error.message, stack: error.stack }
                  : { message: String(error) },
            });
          }
        }

        // 处理已知错误类型
        if (error instanceof Error) {
          switch (error.message) {
            case 'UNAUTHORIZED':
              return apiError('UNAUTHORIZED', {
                status: 401,
                message: '未授权访问',
              });
            case 'FORBIDDEN':
              return apiError('FORBIDDEN', { status: 403, message: '权限不足' });
            case 'NOT_FOUND':
              return apiError('NOT_FOUND', { status: 404, message: '资源不存在' });
            case 'BAD_REQUEST':
              return apiError('BAD_REQUEST', {
                status: 400,
                message: '请求参数错误',
              });
          }
        }

        // 未知错误
        return apiError('INTERNAL_ERROR', {
          status: 500,
          message: '服务器内部错误',
        });
      }
    };
  };
}

/**
 * 身份认证中间件
 * 验证用户已登录，并将 session 注入到 request.context
 *
 * @example
 * const handler = compose(
 *   withErrorHandling(),
 *   withAuth(),
 *   async (request) => {
 *     const session = request.context.session; // 类型安全
 *     // ...
 *   }
 * );
 */
export function withAuth(): Middleware {
  return (handler: RouteHandler): RouteHandler => {
    return async (request) => {
      const reqWithContext = withContext(request);

      // 获取并验证会话
      const session = await getSession();

      if (!session.userId || !session.role || !session.sessionToken) {
        // 清理可能存在的脏 cookie
        if (session.userId || session.role || session.sessionToken) {
          session.destroy();
        }

        // 记录未授权访问
        console.warn('认证失败', {
          code: 'UNAUTHORIZED',
          reason: 'NO_SESSION',
          ip: reqWithContext.context.ip,
          method: reqWithContext.context.method,
          path: reqWithContext.context.path,
        });

        const error = new Error('UNAUTHORIZED') as LoggedError;
        error.logged = true;
        throw error;
      }

      // 校验 sessionToken 是否仍在数据库中有效（可撤销/可过期）
      const dbSession = await prisma.authSession.findUnique({
        where: { sessionToken: session.sessionToken },
        select: { userId: true, expiresAt: true },
      });

      if (!dbSession) {
        session.destroy();

        // 记录会话失效
        console.warn('认证失败', {
          code: 'UNAUTHORIZED',
          reason: 'SESSION_REVOKED',
          userId: session.userId,
          ip: reqWithContext.context.ip,
          method: reqWithContext.context.method,
          path: reqWithContext.context.path,
          sessionTokenPrefix: session.sessionToken.substring(0, 8),
        });

        const error = new Error('UNAUTHORIZED') as LoggedError;
        error.logged = true;
        throw error;
      }

      // 过期会话：最佳努力清理
      if (dbSession.expiresAt <= new Date()) {
        await prisma.authSession.deleteMany({
          where: { sessionToken: session.sessionToken },
        });
        session.destroy();

        // 记录会话过期
        console.warn('认证失败', {
          code: 'UNAUTHORIZED',
          reason: 'SESSION_EXPIRED',
          userId: session.userId,
          ip: reqWithContext.context.ip,
          method: reqWithContext.context.method,
          path: reqWithContext.context.path,
          sessionTokenPrefix: session.sessionToken.substring(0, 8),
          expiresAt: dbSession.expiresAt.toISOString(),
        });

        const error = new Error('UNAUTHORIZED') as LoggedError;
        error.logged = true;
        throw error;
      }

      // 防御：cookie 内 userId 必须与 DB 记录一致
      if (dbSession.userId !== BigInt(session.userId)) {
        session.destroy();
        console.warn('认证失败', {
          code: 'UNAUTHORIZED',
          reason: 'SESSION_USER_MISMATCH',
          userId: session.userId,
          ip: reqWithContext.context.ip,
          method: reqWithContext.context.method,
          path: reqWithContext.context.path,
          sessionTokenPrefix: session.sessionToken.substring(0, 8),
        });

        const error = new Error('UNAUTHORIZED') as LoggedError;
        error.logged = true;
        throw error;
      }

      // 注入 session 到上下文
      reqWithContext.context.session = {
        userId: session.userId,
        role: session.role,
        sessionToken: session.sessionToken,
      };

      return handler(reqWithContext);
    };
  };
}

/**
 * 角色权限检查中间件
 * 必须在 withAuth() 之后使用
 *
 * @param requiredRole 必需的角色
 *
 * @example
 * const handler = compose(
 *   withErrorHandling(),
 *   withAuth(),
 *   withRoleCheck('admin'),
 *   async (request) => {
 *     // 只有 admin 能访问
 *   }
 * );
 */
export function withRoleCheck(requiredRole: UserRole): Middleware {
  return (handler: RouteHandler): RouteHandler => {
    return async (request) => {
      const reqWithContext = withContext(request);

      // 检查 session 是否已注入（必须在 withAuth 之后使用）
      if (!reqWithContext.context.session) {
        throw new Error(
          'withRoleCheck must be used after withAuth middleware'
        );
      }

      // 检查角色权限
      if (reqWithContext.context.session.role !== requiredRole) {
        throw new Error('FORBIDDEN');
      }

      return handler(reqWithContext);
    };
  };
}
