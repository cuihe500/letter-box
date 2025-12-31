'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function SortToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOrder = searchParams.get('order') || 'desc';

  const handleToggle = () => {
    const newOrder = currentOrder === 'desc' ? 'asc' : 'desc';
    router.push(`/?order=${newOrder}`);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-300"
      title={currentOrder === 'desc' ? '点击切换为升序' : '点击切换为倒序'}
    >
      <span className="text-sm">
        {currentOrder === 'desc' ? '按时间倒序（新 → 旧）' : '按时间升序（旧 → 新）'}
      </span>
      <svg
        className="h-4 w-4 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {currentOrder === 'desc' ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        )}
      </svg>
    </button>
  );
}
