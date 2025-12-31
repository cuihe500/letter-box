import Link from 'next/link';
import { formatDate, truncateContent, parseTags } from '@/lib/utils';

interface LetterCardProps {
  id: bigint;
  title: string | null;
  content: string;
  authorLabel: string;
  recipientLabel: string;
  date: Date;
  isPublished?: boolean;
  tags: string | null;
}

export function LetterCard({
  id,
  title,
  content,
  authorLabel,
  recipientLabel,
  date,
  isPublished = true,
  tags,
}: LetterCardProps) {
  const displayTitle = title || '无标题';
  const preview = truncateContent(content);
  const tagList = parseTags(tags);
  const isDraft = !isPublished;

  return (
    <Link href={`/letters/${id}`}>
      <article className="group rounded-2xl border border-rose-100 bg-white/80 p-6 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:border-rose-200 hover:shadow-md">
        {/* 标题 */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 group-hover:text-rose-600">
            {displayTitle}
          </h2>
          {isDraft && (
            <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              草稿
            </span>
          )}
        </div>

        {/* 元信息：发件人 → 收件人 + 日期 */}
        <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium text-rose-600">{authorLabel}</span>
            <span className="text-gray-400">→</span>
            <span className="font-medium text-amber-600">{recipientLabel}</span>
          </div>
          <time className="text-gray-500">{formatDate(date)}</time>
        </div>

        {/* 内容预览 */}
        <p className="mt-4 leading-relaxed text-gray-700 line-clamp-3">
          {preview}
        </p>

        {/* 标签 */}
        {tagList.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tagList.map((tag, index) => (
              <span
                key={index}
                className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 阅读提示 */}
        <div className="mt-4 text-sm font-medium text-rose-600 opacity-0 transition-opacity group-hover:opacity-100">
          阅读全文 →
        </div>
      </article>
    </Link>
  );
}
