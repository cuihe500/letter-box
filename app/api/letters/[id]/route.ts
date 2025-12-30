import { compose, withErrorHandling, withAuth } from '@/lib/middleware';
import { apiOk, apiError } from '@/lib/api/response';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import type { NextRequest } from 'next/server';

// 信件更新请求验证
const updateLetterSchema = z.object({
  title: z.string().max(255).optional().nullable(),
  content: z.string().min(1).optional(),
  recipientId: z.coerce.bigint().optional(),
  writtenAt: z.string().datetime().optional().nullable(),
  isPublished: z.boolean().optional(),
  tags: z.string().max(500).optional().nullable(),
});

// 辅助函数：从URL中提取ID
function getLetterIdFromUrl(request: NextRequest): bigint {
  const url = new URL(request.url);
  const parts = url.pathname.split('/');
  const id = parts[parts.length - 1];
  return BigInt(id);
}

/**
 * GET /api/letters/[id]
 * 获取单封信件详情
 */
export const GET = compose(
  withErrorHandling(),
  withAuth(),
  async (request: import('@/lib/middleware').RequestWithContext) => {
    const letterId = getLetterIdFromUrl(request);
    const session = request.context.session!;

    const letter = await prisma.letter.findUnique({
      where: { id: letterId },
      include: {
        author: {
          select: { id: true, role: true },
        },
        recipient: {
          select: { id: true, role: true },
        },
      },
    });

    if (!letter) {
      return apiError('信件不存在', { status: 404 });
    }

    // viewer只能查看已发布的信件
    if (session.role === 'viewer' && !letter.isPublished) {
      return apiError('信件不存在', { status: 404 });
    }

    return apiOk(letter);
  }
);

/**
 * PUT /api/letters/[id]
 * 更新信件
 */
export const PUT = compose(
  withErrorHandling(),
  withAuth(),
  async (request: import('@/lib/middleware').RequestWithContext) => {
    const session = request.context.session!;

    // 只有admin可以更新信件
    if (session.role !== 'admin') {
      return apiError('权限不足', { status: 403 });
    }

    const letterId = getLetterIdFromUrl(request);

    // 检查信件是否存在
    const existingLetter = await prisma.letter.findUnique({
      where: { id: letterId },
    });

    if (!existingLetter) {
      return apiError('信件不存在', { status: 404 });
    }

    const body = await request.json();
    const validationResult = updateLetterSchema.safeParse(body);

    if (!validationResult.success) {
      return apiError('无效的请求数据', {
        status: 400,
        data: validationResult.error.format(),
      });
    }

    const { title, content, recipientId, writtenAt, isPublished, tags } =
      validationResult.data;

    // 构建更新数据
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (recipientId !== undefined) updateData.recipientId = recipientId;
    if (writtenAt !== undefined)
      updateData.writtenAt = writtenAt ? new Date(writtenAt) : null;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (tags !== undefined) updateData.tags = tags;

    // 更新信件
    const letter = await prisma.letter.update({
      where: { id: letterId },
      data: updateData,
      include: {
        author: {
          select: { id: true, role: true },
        },
        recipient: {
          select: { id: true, role: true },
        },
      },
    });

    return apiOk(letter);
  }
);

/**
 * DELETE /api/letters/[id]
 * 删除信件
 */
export const DELETE = compose(
  withErrorHandling(),
  withAuth(),
  async (request: import('@/lib/middleware').RequestWithContext) => {
    const session = request.context.session!;

    // 只有admin可以删除信件
    if (session.role !== 'admin') {
      return apiError('权限不足', { status: 403 });
    }

    const letterId = getLetterIdFromUrl(request);

    // 检查信件是否存在
    const existingLetter = await prisma.letter.findUnique({
      where: { id: letterId },
    });

    if (!existingLetter) {
      return apiError('信件不存在', { status: 404 });
    }

    // 删除信件
    await prisma.letter.delete({
      where: { id: letterId },
    });

    return apiOk({ id: letterId, deleted: true });
  }
);
