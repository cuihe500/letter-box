import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { LoginForm } from '@/components/auth/login-form';

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

function getSafeNextPath(nextParam: string | string[] | undefined): string {
  const nextPath = typeof nextParam === 'string' ? nextParam : undefined;
  if (!nextPath) return '/';
  if (!nextPath.startsWith('/')) return '/';
  if (nextPath.startsWith('//')) return '/';
  return nextPath;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = getSafeNextPath((await searchParams)?.next);

  try {
    await requireAuth();
    redirect(nextPath);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')
    ) {
      // 用户未登录：继续渲染登录页
    } else {
      throw error;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-rose-100 bg-white/80 p-8 shadow-sm backdrop-blur">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-sm">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M21 8.5C21 6.01472 18.9853 4 16.5 4C14.6847 4 13.12 5.07951 12.402 6.63289C12.1652 7.14543 11.8348 7.14543 11.598 6.63289C10.88 5.07951 9.31533 4 7.5 4C5.01472 4 3 6.01472 3 8.5C3 15 12 20 12 20C12 20 21 15 21 8.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              欢迎来到小邮局
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              请输入密码查阅信件
            </p>
          </div>

          <LoginForm nextPath={nextPath} />
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          登录失败次数过多会被暂时锁定（15 分钟）。
        </p>
      </div>
    </div>
  );
}
