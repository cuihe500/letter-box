import type { Letter, AuthUser } from '@prisma/client';

/**
 * 信件列表项类型（包含作者和收件人信息）
 */
export type LetterWithUsers = Letter & {
  author: Pick<AuthUser, 'id' | 'role'>;
  recipient: Pick<AuthUser, 'id' | 'role'>;
};

/**
 * 信件列表响应类型
 */
export type LettersResponse = {
  letters: LetterWithUsers[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

/**
 * 信件创建/更新表单数据
 */
export type LetterFormData = {
  title?: string;
  content: string;
  recipientId: bigint;
  writtenAt?: string;
  isPublished?: boolean;
  tags?: string;
};
