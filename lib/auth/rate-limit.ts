import { prisma } from '@/lib/db';

// 最大失败尝试次数
const MAX_ATTEMPTS = 5;
// 锁定时长（分钟）
const LOCK_DURATION_MINUTES = 15;

/**
 * 检查IP是否被限流
 * @param ip 客户端IP地址
 * @returns 是否允许登录以及锁定到期时间
 */
export async function checkRateLimit(ip: string): Promise<{
  allowed: boolean;
  lockedUntil?: Date;
  remainingAttempts?: number;
}> {
  const attempt = await prisma.authLoginAttempt.findFirst({
    where: { ipAddress: ip },
  });

  if (!attempt) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // 检查是否在锁定期内
  if (attempt.lockedUntil && new Date() < attempt.lockedUntil) {
    return {
      allowed: false,
      lockedUntil: attempt.lockedUntil,
      remainingAttempts: 0,
    };
  }

  // 如果锁定已过期，允许登录
  if (attempt.lockedUntil && new Date() >= attempt.lockedUntil) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // 检查失败次数
  const remaining = MAX_ATTEMPTS - attempt.failedAttempts;
  return {
    allowed: attempt.failedAttempts < MAX_ATTEMPTS,
    remainingAttempts: remaining > 0 ? remaining : 0,
  };
}

/**
 * 记录失败的登录尝试
 * @param ip 客户端IP地址
 */
export async function recordFailedAttempt(ip: string): Promise<void> {
  const existing = await prisma.authLoginAttempt.findFirst({
    where: { ipAddress: ip },
  });

  if (!existing) {
    // 首次失败，创建记录
    await prisma.authLoginAttempt.create({
      data: {
        ipAddress: ip,
        failedAttempts: 1,
        lastAttemptAt: new Date(),
      },
    });
  } else {
    const newCount = existing.failedAttempts + 1;

    // 如果达到或超过最大尝试次数，设置锁定时间
    const lockedUntil =
      newCount >= MAX_ATTEMPTS
        ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
        : null;

    await prisma.authLoginAttempt.update({
      where: { id: existing.id },
      data: {
        failedAttempts: newCount,
        lockedUntil,
        lastAttemptAt: new Date(),
      },
    });
  }
}

/**
 * 重置失败尝试记录（登录成功后调用）
 * @param ip 客户端IP地址
 */
export async function resetFailedAttempts(ip: string): Promise<void> {
  await prisma.authLoginAttempt.deleteMany({
    where: { ipAddress: ip },
  });
}
