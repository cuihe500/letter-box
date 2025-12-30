'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MarkdownRenderer } from './markdown-renderer';
import type { LetterWithUsers } from '@/lib/types/letter';

interface LetterFormProps {
  letter?: LetterWithUsers;
  recipientId: bigint;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * 信件创建/编辑表单组件
 * Client Component - 需要表单交互和状态管理
 */
export function LetterForm({
  letter,
  recipientId,
  onSuccess,
  onCancel,
}: LetterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    title: letter?.title || '',
    content: letter?.content || '',
    writtenAt: letter?.writtenAt
      ? new Date(letter.writtenAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    isPublished: letter?.isPublished ?? true,
    tags: letter?.tags || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = letter ? `/api/letters/${letter.id}` : '/api/letters';
      const method = letter ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recipientId: recipientId.toString(),
          writtenAt: formData.writtenAt
            ? new Date(formData.writtenAt).toISOString()
            : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '操作失败');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/letters/${data.data.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 标题 */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          标题（可选）
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          placeholder="给这封信起个标题吧"
          maxLength={255}
        />
      </div>

      {/* 写信日期 */}
      <div>
        <label
          htmlFor="writtenAt"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          写信日期
        </label>
        <input
          type="date"
          id="writtenAt"
          value={formData.writtenAt}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, writtenAt: e.target.value }))
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      {/* 标签 */}
      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          标签（可选，用逗号分隔）
        </label>
        <input
          type="text"
          id="tags"
          value={formData.tags}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, tags: e.target.value }))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          placeholder="例如：生日, 纪念日, 日常"
          maxLength={500}
        />
      </div>

      {/* 内容编辑/预览切换 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700"
          >
            信件内容（支持 Markdown 格式）
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-rose-600 hover:text-rose-700 font-medium"
          >
            {showPreview ? '编辑' : '预览'}
          </button>
        </div>

        {showPreview ? (
          <div className="min-h-[400px] border border-gray-300 rounded-lg p-4 bg-gradient-to-br from-white to-rose-50/30">
            <MarkdownRenderer content={formData.content} />
          </div>
        ) : (
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, content: e.target.value }))
            }
            className="w-full min-h-[400px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent font-mono text-sm"
            placeholder="在这里写下你的心里话...&#10;&#10;支持 Markdown 格式：&#10;- **粗体** 和 *斜体*&#10;- [链接](url)&#10;- 列表、引用等"
            required
          />
        )}
      </div>

      {/* 发布状态 */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublished"
          checked={formData.isPublished}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))
          }
          className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
        />
        <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
          发布（不勾选将保存为草稿）
        </label>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !formData.content.trim()}
          className="flex-1 bg-rose-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting
            ? '保存中...'
            : letter
              ? '更新信件'
              : '保存信件'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
}
