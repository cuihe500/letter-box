import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { LetterCard } from '@/components/features/letter-card';
import { SortToggle } from '@/components/letters';

export const dynamic = 'force-dynamic';

async function logoutAction() {
  'use server';

  const sessionData = await requireAuth();

  await prisma.authSession.deleteMany({
    where: { sessionToken: sessionData.sessionToken },
  });

  const session = await getSession();
  session.destroy();

  redirect('/login');
}

type HomeProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  let session: Awaited<ReturnType<typeof requireAuth>>;
  try {
    session = await requireAuth();
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      redirect('/login?next=/');
    }
    throw error;
  }

  // 获取排序参数
  const params = await searchParams;
  const sortOrder = params.order === 'asc' ? 'asc' : 'desc';

  // 查询所有已发布的信件，根据参数排序
  const where =
    session.role === 'viewer'
      ? {
          isPublished: true,
        }
      : {};

  const [currentUser, letters] = await Promise.all([
    prisma.authUser.findUnique({
      where: { id: BigInt(session.userId) },
      select: { name: true },
    }),
    prisma.letter.findMany({
      where,
      include: {
        author: {
          select: { id: true, role: true, name: true },
        },
        recipient: {
          select: { id: true, role: true, name: true },
        },
      },
      orderBy: [
        { writtenAt: { sort: sortOrder, nulls: sortOrder === 'desc' ? 'last' : 'first' } },
        { createdAt: sortOrder },
      ],
    }),
  ]);

  const currentUserName =
    currentUser?.name ??
    (session.role === 'admin' ? '管理员' : '访客');

  const draftCount =
    session.role === 'admin'
      ? letters.reduce((count, letter) => (letter.isPublished ? count : count + 1), 0)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b border-rose-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Letter Box
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              已登录：{currentUserName}
            </p>
          </div>
          <div className="flex gap-2">
            {session.role === 'admin' && (
              <Link
                href="/letters/new"
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                写信
              </Link>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                退出登录
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {letters.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <div>
              共 {letters.length} 封信
              {draftCount > 0 && <>，其中 {draftCount} 封草稿</>}
            </div>
            <SortToggle />
          </div>
        )}
        {letters.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl">📮</div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">
              还没有任何信件
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              开始写下你们的第一封信吧！
            </p>
            {session.role === 'admin' && (
              <Link
                href="/letters/new"
                className="mt-4 inline-block rounded-lg bg-rose-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                开始写信
              </Link>
            )}
          </div>
        ) : (
          /* 信件列表 */
          <div className="space-y-6">
            {letters.map((letter) => (
              <LetterCard
                key={letter.id.toString()}
                id={letter.id}
                title={letter.title}
                content={letter.content}
                authorLabel={letter.author.name}
                recipientLabel={letter.recipient.name}
                date={letter.writtenAt ?? letter.createdAt}
                isPublished={letter.isPublished}
                tags={letter.tags}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
