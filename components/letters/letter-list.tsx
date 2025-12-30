import { LetterCard } from './letter-card';
import type { LetterWithUsers } from '@/lib/types/letter';

interface LetterListProps {
  letters: LetterWithUsers[];
  emptyMessage?: string;
}

/**
 * 信件列表组件
 * Server Component - 展示信件卡片列表
 */
export function LetterList({
  letters,
  emptyMessage = '还没有信件，快来写第一封吧',
}: LetterListProps) {
  if (letters.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 text-lg mb-4">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {letters.map((letter) => (
        <LetterCard key={letter.id.toString()} letter={letter} />
      ))}
    </div>
  );
}
