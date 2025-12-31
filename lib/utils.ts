/**
 * 格式化日期为友好格式
 * @param date - 日期对象
 * @returns 格式化后的日期字符串，如 "2024年1月15日"
 */
export const APP_TIME_ZONE = 'Asia/Shanghai';

const DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const DATE_WITH_WEEKDAY_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const DATE_INPUT_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}

/**
 * 格式化日期为 “2025年12月31日 星期三” 这种格式（固定 UTC+8 时区）
 */
export function formatDateWithWeekday(date: Date): string {
  const parts = DATE_WITH_WEEKDAY_FORMATTER.formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value?.trim();
  const dateText = parts
    .filter((part) => part.type !== 'weekday')
    .map((part) => part.value)
    .join('')
    .trim();

  if (!weekday) return dateText;
  return `${dateText} ${weekday}`;
}

/**
 * 格式化时间（固定 UTC+8 时区）
 */
export function formatDateTime(date: Date): string {
  return DATE_TIME_FORMATTER.format(date);
}

/**
 * 格式化为 `<input type="date" />` 需要的 YYYY-MM-DD（固定 UTC+8 时区）
 */
export function formatDateInputValue(date: Date): string {
  const parts = DATE_INPUT_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

/**
 * 截取内容预览
 * @param content - 完整内容
 * @param maxLength - 最大长度，默认 150
 * @returns 截取后的内容，如果超过长度则添加 "..."
 */
export function truncateContent(content: string, maxLength: number = 150): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ') // 移除代码块
    .replace(/`([^`]+)`/g, '$1') // 移除行内代码
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // 图片保留 alt 文本
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接保留文字
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/^\s*>\s?/gm, '') // 移除引用标记
    .replace(/^\s*[-*+]\s+/gm, '') // 移除无序列表标记
    .replace(/^\s*\d+\.\s+/gm, '') // 移除有序列表标记
    .replace(/\*\*(.+?)\*\*/g, '$1') // 移除加粗
    .replace(/\*(.+?)\*/g, '$1') // 移除斜体
    .replace(/_{1,3}(.+?)_{1,3}/g, '$1') // 移除下划线强调
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) {
    return plain;
  }
  return plain.slice(0, maxLength) + '...';
}

/**
 * 解析标签字符串
 * @param tags - 标签字符串，逗号分隔
 * @returns 标签数组
 */
export function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags.split(',').map(tag => tag.trim()).filter(Boolean);
}
