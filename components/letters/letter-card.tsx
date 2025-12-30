import Link from 'next/link';
import type { LetterWithUsers } from '@/lib/types/letter';

interface LetterCardProps {
  letter: LetterWithUsers;
}

/**
 * 信件卡片组件
 * Server Component - 在信件列表中展示单封信件的摘要信息
 */
export function LetterCard({ letter }: LetterCardProps) {
  // 格式化日期
  const formatDate = (date: Date | null) => {
    if (!date) return '未知日期';
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 提取内容摘要（去除Markdown标记，取前150字）
  const getExcerpt = (content: string, maxLength = 150) => {
    const plain = content
      .replace(/#{1,6}\s/g, '') // 移除标题标记
      .replace(/\*\*(.+?)\*\*/g, '$1') // 移除加粗
      .replace(/\*(.+?)\*/g, '$1') // 移除斜体
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接
      .replace(/`(.+?)`/g, '$1') // 移除代码
      .replace(/\n/g, ' ') // 移除换行
      .trim();

    return plain.length > maxLength
      ? plain.substring(0, maxLength) + '...'
      : plain;
  };

  // 角色显示名称
  const getRoleName = (role: string) => {
    return role === 'admin' ? '你' : 'Ta';
  };

  // 解析标签
  const tags = letter.tags
    ? letter.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  return (
    <Link href={`/letters/${letter.id}`}>
      <article className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-gray-100 hover:border-rose-200">
        {/* 标题 */}
        <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-rose-600 transition-colors">
          {letter.title || '无标题信件'}
        </h3>

        {/* 元信息 */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <span>
            {getRoleName(letter.author.role)} → {getRoleName(letter.recipient.role)}
          </span>
          <span>•</span>
          <time dateTime={letter.writtenAt?.toISOString()}>
            {formatDate(letter.writtenAt)}
          </time>
          {!letter.isPublished && (
            <>
              <span>•</span>
              <span className="text-amber-600 font-medium">草稿</span>
            </>
          )}
        </div>

        {/* 内容摘要 */}
        <p className="text-gray-600 leading-relaxed mb-3">
          {getExcerpt(letter.content)}
        </p>

        {/* 标签 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-rose-50 text-rose-600 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Hover提示 */}
        <div className="mt-4 text-sm text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
          阅读完整信件 →
        </div>
      </article>
    </Link>
  );
}
