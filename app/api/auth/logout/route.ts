import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { compose, withAuth, withErrorHandling } from '@/lib/middleware';
import { apiOk } from '@/lib/api/response';

export const POST = compose(
  withErrorHandling(),
  withAuth(),
  async (request: import('@/lib/middleware').RequestWithContext) => {
    const sessionToken = request.context.session!.sessionToken;

    // 记录登出
    console.log('用户登出', {
      userId: request.context.session!.userId,
      role: request.context.session!.role,
      sessionToken: sessionToken.substring(0, 8),
    });

    // 删除数据库中的 session 记录
    await prisma.authSession.deleteMany({
      where: { sessionToken },
    });

    // 清除session cookie
    const session = await getSession();
    session.destroy();

    return apiOk(null);
  }
);
