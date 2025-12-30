import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import type { SessionData } from './types';
import { prisma } from '@/lib/db';

// Iron Session配置
const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'letter-box-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60, // 7天（秒）
    httpOnly: true,
    sameSite: 'lax' as const,
  },
};

/**
 * 获取当前会话
 * @returns Session对象
 */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * 要求用户已登录，可选地要求特定角色
 * @param requiredRole 可选的必需角色（'admin'）
 * @returns Session数据
 * @throws 如果未登录或权限不足
 */
export async function requireAuth(requiredRole?: 'admin'): Promise<SessionData> {
  const session = await getSession();

  if (!session.userId || !session.role || !session.sessionToken) {
    // 清理可能存在的脏 cookie
    if (session.userId || session.role || session.sessionToken) {
      session.destroy();
    }
    throw new Error('UNAUTHORIZED');
  }

  // 校验 sessionToken 是否仍在数据库中有效（可撤销/可过期）
  const dbSession = await prisma.authSession.findUnique({
    where: { sessionToken: session.sessionToken },
    select: { userId: true, expiresAt: true },
  });

  if (!dbSession) {
    session.destroy();
    throw new Error('UNAUTHORIZED');
  }

  // 过期会话：最佳努力清理
  if (dbSession.expiresAt <= new Date()) {
    await prisma.authSession.deleteMany({
      where: { sessionToken: session.sessionToken },
    });
    session.destroy();
    throw new Error('UNAUTHORIZED');
  }

  // 防御：cookie 内 userId 必须与 DB 记录一致
  if (dbSession.userId !== BigInt(session.userId)) {
    session.destroy();
    throw new Error('UNAUTHORIZED');
  }

  if (requiredRole === 'admin' && session.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }

  return session as SessionData;
}
