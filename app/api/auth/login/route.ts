import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { getSession } from '@/lib/auth/session';
import {
  recordFailedAttempt,
  resetFailedAttempts,
  checkRateLimit,
} from '@/lib/auth/rate-limit';
import { compose, withErrorHandling, withRateLimit } from '@/lib/middleware';
import { apiError, apiOk } from '@/lib/api/response';
import crypto from 'crypto';

export const POST = compose(
  withErrorHandling(),
  withRateLimit(),
  async (request: import('@/lib/middleware').RequestWithContext) => {
    const ip = request.context.ip!;

    const { password } = await request.json();

    if (!password) {
      return apiError('PASSWORD_REQUIRED', { status: 400 });
    }

    // 查询所有用户（admin和viewer）
    const users = await prisma.authUser.findMany();
    let matchedUser: (typeof users)[number] | null = null;

    // 尝试匹配密码
    for (const user of users) {
      const isMatch = await verifyPassword(password, user.passwordHash);
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    // 密码不匹配
    if (!matchedUser) {
      await recordFailedAttempt(ip);
      const updatedLimit = await checkRateLimit(ip);

      // 记录失败登录
      console.warn('认证失败', {
        ip,
        method: request.context.method,
        path: request.context.path,
        code: 'INVALID_PASSWORD',
        remainingAttempts: updatedLimit.remainingAttempts ?? null,
        lockedUntil: updatedLimit.lockedUntil?.toISOString() ?? null,
      });

      return apiError('INVALID_PASSWORD', {
        status: 401,
        data: { remainingAttempts: updatedLimit.remainingAttempts ?? null },
      });
    }

    // 密码匹配成功，生成会话
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天

    // 创建session记录
    await prisma.authSession.create({
      data: {
        sessionToken,
        userId: matchedUser.id,
        expiresAt,
      },
    });

    // 设置session cookie
    const session = await getSession();
    session.userId = Number(matchedUser.id);
    session.role = matchedUser.role;
    session.sessionToken = sessionToken;
    await session.save();

    // 记录成功登录
    console.log('用户登录成功', {
      userId: Number(matchedUser.id),
      role: matchedUser.role,
      ip,
      sessionToken: sessionToken.substring(0, 8),
    });

    // 重置失败记录
    await resetFailedAttempts(ip);

    return apiOk({ role: matchedUser.role });
  }
);
