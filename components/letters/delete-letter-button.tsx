'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiResponse } from '@/lib/api/response';

type DeleteLetterSuccessData = { id: string; deleted: boolean };

export function DeleteLetterButton({ letterId }: { letterId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (isDeleting) return;

    setError(null);
    const confirmed = window.confirm('确定要删除这封信吗？此操作无法撤销。');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/letters/${encodeURIComponent(letterId)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      const payload = (await response.json()) as ApiResponse<
        DeleteLetterSuccessData,
        unknown
      >;

      if (!response.ok || !payload.success) {
        const message =
          (!payload.success && payload.message) ||
          (!payload.success && payload.error) ||
          '删除失败，请稍后重试';
        setError(message);
        return;
      }

      router.replace('/');
      router.refresh();
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDeleting ? '删除中…' : '删除'}
      </button>
      {error && (
        <div className="text-xs text-red-600" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

