import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { LetterDetail } from '@/components/letters/letter-detail';
import { DeleteLetterButton } from '@/components/letters/delete-letter-button';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * 信件详情页面
 * 展示单封信件的完整内容
 */
export default async function LetterDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 验证登录
  let session;
  try {
    session = await requireAuth();
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      redirect(`/login?next=/letters/${id}`);
    }
    throw error;
  }

  // 查询信件（包含作者和收件人信息）
  const letter = await prisma.letter.findUnique({
    where: { id: BigInt(id) },
    include: {
      author: {
        select: { id: true, role: true, name: true },
      },
      recipient: {
        select: { id: true, role: true, name: true },
      },
    },
  });

  // 权限检查：信件不存在或 viewer 只能看已发布的信件
  if (!letter || (session.role === 'viewer' && !letter.isPublished)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b border-rose-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              信件详情
            </h1>
          </div>
          <div className="flex items-start gap-2">
            {session.role === 'admin' && (
              <>
                <Link
                  href={`/letters/${id}/edit`}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
                >
                  编辑
                </Link>
                <DeleteLetterButton letterId={id} />
              </>
            )}
            <Link
              href="/"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200"
            >
              返回主页
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <LetterDetail letter={letter} />
      </main>
    </div>
  );
}
