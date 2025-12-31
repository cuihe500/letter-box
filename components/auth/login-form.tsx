'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiResponse } from '@/lib/api/response';
import type { UserRole } from '@/lib/auth/types';
import { formatDateTime } from '@/lib/utils';

type LoginSuccessData = { role: UserRole };
type LoginErrorData = {
  remainingAttempts?: number | null;
  lockedUntil?: string | null;
};

function getSafeNextPath(nextPath: string | undefined): string {
  if (!nextPath) return '/';
  if (!nextPath.startsWith('/')) return '/';
  if (nextPath.startsWith('//')) return '/';
  return nextPath;
}

function formatLockedUntil(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return formatDateTime(date);
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const safeNextPath = useMemo(
    () => getSafeNextPath(nextPath),
    [nextPath]
  );

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helper, setHelper] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setHelper(null);

    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const payload = (await response.json()) as ApiResponse<
        LoginSuccessData,
        LoginErrorData
      >;

      if (!response.ok || !payload.success) {
        const errorCode = payload.success ? 'UNKNOWN_ERROR' : payload.error;

        if (
          !payload.success &&
          payload.data &&
          typeof payload.data === 'object'
        ) {
          const lockedUntil =
            typeof payload.data.lockedUntil === 'string'
              ? payload.data.lockedUntil
              : null;
          const remainingAttempts =
            typeof payload.data.remainingAttempts === 'number'
              ? payload.data.remainingAttempts
              : null;

          if (lockedUntil) {
            setHelper(`解锁时间：${formatLockedUntil(lockedUntil)}`);
          } else if (remainingAttempts !== null) {
            setHelper(`剩余尝试次数：${remainingAttempts}`);
          }
        }

        const message =
          (!payload.success && payload.message) ||
          (() => {
            switch (errorCode) {
              case 'PASSWORD_REQUIRED':
                return '请输入密码';
              case 'INVALID_PASSWORD':
                return '密码不正确';
              case 'ACCOUNT_LOCKED':
                return '登录失败次数过多，请稍后再试';
              default:
                return '登录失败，请重试';
            }
          })();

        setError(message);
        return;
      }

      router.replace(safeNextPath);
      router.refresh();
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(error || helper) && (
        <div
          className={[
            'rounded-lg border px-4 py-3 text-sm',
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-amber-200 bg-amber-50 text-amber-800',
          ].join(' ')}
          role={error ? 'alert' : undefined}
        >
          {error && <div className="font-medium">{error}</div>}
          {helper && <div className={error ? 'mt-1 text-red-600' : ''}>{helper}</div>}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          密码
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-12 text-gray-900 shadow-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:bg-gray-50"
            placeholder="请输入密码"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={isSubmitting}
            className="absolute inset-y-0 right-0 px-3 text-sm text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed"
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
          >
            {showPassword ? '隐藏' : '显示'}
          </button>
        </div>
        <p className="text-xs leading-5 text-gray-500">
          输入后系统会自动识别身份。
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-rose-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:cursor-not-allowed disabled:bg-rose-300"
      >
        {isSubmitting ? '登录中…' : '进入信箱'}
      </button>
    </form>
  );
}
