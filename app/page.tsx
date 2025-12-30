import { redirect } from 'next/navigation';
import { getSession, requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getRoleLabel(role: string) {
  return role === 'admin' ? '管理员（你）' : '访客（Ta）';
}

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

export default async function Home() {
  let session: Awaited<ReturnType<typeof requireAuth>>;
  try {
    session = await requireAuth();
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      redirect('/login?next=/');
    }
    throw error;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-rose-100 bg-white/80 p-8 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Letter Box
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            已登录：{getRoleLabel(session.role)}
          </p>

          <div className="mt-8">
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                退出登录
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
