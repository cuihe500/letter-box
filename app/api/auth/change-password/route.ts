import { prisma } from '@/lib/db';
import {
  verifyPassword,
  hashPassword,
  validatePasswordStrength,
} from '@/lib/auth/password';
import { compose, withErrorHandling, withAuth } from '@/lib/middleware';
import { apiError, apiOk } from '@/lib/api/response';

export const PUT = compose(
  withErrorHandling(),
  withAuth(),
  async (request: import('@/lib/middleware').RequestWithContext) => {
    const session = request.context.session!;

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return apiError('PASSWORDS_REQUIRED', { status: 400 });
    }

    // 验证新密码强度
    if (!validatePasswordStrength(newPassword)) {
      return apiError('WEAK_PASSWORD', { status: 400 });
    }

    // 查询用户
    const user = await prisma.authUser.findUnique({
      where: { id: BigInt(session.userId) },
    });

    if (!user) {
      throw new Error('NOT_FOUND');
    }

    // 验证当前密码
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return apiError('INVALID_CURRENT_PASSWORD', { status: 401 });
    }

    // 加密新密码
    const newPasswordHash = await hashPassword(newPassword);

    // 更新密码
    await prisma.authUser.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // 记录密码修改
    console.log('密码已修改', {
      userId: session.userId,
      role: session.role,
    });

    // 删除该用户的所有会话（强制重新登录）
    await prisma.authSession.deleteMany({
      where: { userId: user.id },
    });

    return apiOk(null);
  }
);
