'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { LetterWithUsers } from '@/lib/types/letter';
import { formatDateInputValue } from '@/lib/utils';

// 动态导入 MDEditor，避免 SSR 问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

interface LetterFormProps {
  letter?: LetterWithUsers;
  recipients: Array<{ id: bigint; role: string; name: string }>;
  currentUserId?: bigint;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * 信件创建/编辑表单组件
 * Client Component - 需要表单交互和状态管理
 */
export function LetterForm({
  letter,
  recipients,
  onSuccess,
  onCancel,
}: LetterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    title: letter?.title || '',
    content: letter?.content || '',
    recipientId: letter?.recipientId.toString() || '',
    writtenAt: letter?.writtenAt
      ? formatDateInputValue(new Date(letter.writtenAt))
      : formatDateInputValue(new Date()),
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
          recipientId: formData.recipientId,
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

      {/* 收件人选择 */}
      <div>
        <label
          htmlFor="recipientId"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          收件人
        </label>
        <select
          id="recipientId"
          value={formData.recipientId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, recipientId: e.target.value }))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          required
        >
          <option value="">请选择收件人</option>
          {recipients.map((user) => (
            <option key={user.id.toString()} value={user.id.toString()}>
              {user.name}
            </option>
          ))}
        </select>
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

      {/* 内容编辑器 */}
      <div data-color-mode="light">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          信件内容（支持 Markdown 格式）
        </label>
        <MDEditor
          value={formData.content}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, content: value || '' }))
          }
          height={500}
          preview="live"
          hideToolbar={false}
          enableScroll={true}
          textareaProps={{
            placeholder: '在这里写下你的心里话...\n\n支持 Markdown 格式：\n- **粗体** 和 *斜体*\n- [链接](url)\n- 列表、引用等',
            required: true,
          }}
        />
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
          disabled={isSubmitting || !formData.content.trim() || !formData.recipientId}
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
