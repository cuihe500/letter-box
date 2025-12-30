import { MarkdownRenderer } from './markdown-renderer';
import type { LetterWithUsers } from '@/lib/types/letter';

interface LetterDetailProps {
  letter: LetterWithUsers;
}

/**
 * 信件详情组件
 * Server Component - 展示完整的信件内容
 */
export function LetterDetail({ letter }: LetterDetailProps) {
  // 格式化日期
  const formatDate = (date: Date | null) => {
    if (!date) return '未知日期';
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  // 角色显示名称
  const getRoleName = (role: string) => {
    return role === 'admin' ? '你' : 'Ta';
  };

  // 解析标签
  const tags = letter.tags
    ? letter.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <article className="max-w-4xl mx-auto">
      {/* 信件头部 */}
      <header className="mb-8 pb-6 border-b-2 border-rose-100">
        {/* 状态标签 */}
        {!letter.isPublished && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-full font-medium">
              草稿
            </span>
          </div>
        )}

        {/* 标题 */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          {letter.title || '无标题信件'}
        </h1>

        {/* 元信息 */}
        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">发信人：</span>
            <span className="text-rose-600 font-semibold">
              {getRoleName(letter.author.role)}
            </span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">收信人：</span>
            <span className="text-rose-600 font-semibold">
              {getRoleName(letter.recipient.role)}
            </span>
          </div>
          <span className="text-gray-300">•</span>
          <time
            dateTime={letter.writtenAt?.toISOString()}
            className="text-sm"
          >
            {formatDate(letter.writtenAt)}
          </time>
        </div>

        {/* 标签 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-3 py-1 text-sm bg-rose-50 text-rose-600 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* 信件内容 */}
      <div className="bg-gradient-to-br from-white to-rose-50/30 rounded-lg p-8 shadow-sm border border-rose-100">
        <MarkdownRenderer content={letter.content} />
      </div>

      {/* 信件尾部 */}
      <footer className="mt-8 pt-6 border-t border-rose-100 text-sm text-gray-500">
        <div className="flex justify-between items-center">
          <div>
            创建于{' '}
            {new Date(letter.createdAt).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          {letter.updatedAt.getTime() !== letter.createdAt.getTime() && (
            <div>
              最后编辑于{' '}
              {new Date(letter.updatedAt).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          )}
        </div>
      </footer>
    </article>
  );
}
