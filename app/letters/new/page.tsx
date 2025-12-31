import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { LetterForm } from '@/components/letters/letter-form';

export const dynamic = 'force-dynamic';

/**
 * 新建信件页面
 * 仅 admin 可访问
 */
export default async function NewLetterPage() {
  // 验证权限：仅 admin 可创建信件
  let session;
  try {
    session = await requireAuth('admin');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      redirect('/login?next=/letters/new');
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      // viewer 用户尝试访问，重定向到首页
      redirect('/');
    }
    throw error;
  }

  // 查询收件人列表（排除当前用户）
  const recipients = await prisma.authUser.findMany({
    where: {
      id: { not: BigInt(session.userId) },
    },
    select: {
      id: true,
      role: true,
      name: true,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b border-rose-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              写信
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              记录珍贵的时刻
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200"
          >
            返回主页
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <LetterForm
          recipients={recipients}
          currentUserId={BigInt(session.userId)}
        />
      </main>
    </div>
  );
}
