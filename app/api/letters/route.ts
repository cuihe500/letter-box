import { compose, withErrorHandling, withAuth } from '@/lib/middleware';
import { apiOk, apiError } from '@/lib/api/response';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

// 信件创建请求验证
const createLetterSchema = z.object({
  title: z.string().max(255).optional(),
  content: z.string().min(1, '信件内容不能为空'),
  recipientId: z.coerce.bigint(),
  writtenAt: z.string().datetime().optional(),
  isPublished: z.boolean().optional(),
  tags: z.string().max(500).optional(),
});

// 查询参数验证
const querySchema = z.object({
  authorId: z.coerce.bigint().optional(),
  recipientId: z.coerce.bigint().optional(),
  isPublished: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  orderBy: z.enum(['writtenAt', 'createdAt', 'updatedAt']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
});

/**
 * GET /api/letters
 * 获取信件列表
 */
export const GET = compose(
  withErrorHandling(),
  withAuth(),
  async (request: import('@/lib/middleware').RequestWithContext) => {
    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const queryResult = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!queryResult.success) {
      return apiError('无效的查询参数', {
        status: 400,
        data: queryResult.error.format()
      });
    }

    const {
      authorId,
      recipientId,
      isPublished,
      limit = 20,
      offset = 0,
      orderBy = 'writtenAt',
      orderDirection = 'desc',
    } = queryResult.data;

    // 构建查询条件
    const where: Prisma.LetterWhereInput = {};
    if (authorId) where.authorId = authorId;
    if (recipientId) where.recipientId = recipientId;
    if (isPublished !== undefined) where.isPublished = isPublished === 'true';

    // viewer角色只能看到已发布的信件
    const session = request.context.session!;
    if (session.role === 'viewer') {
      where.isPublished = true;
    }

    // 查询信件列表
    const [letters, total] = await Promise.all([
      prisma.letter.findMany({
        where,
        include: {
          author: {
            select: { id: true, role: true },
          },
          recipient: {
            select: { id: true, role: true },
          },
        },
        orderBy: { [orderBy]: orderDirection },
        take: limit,
        skip: offset,
      }),
      prisma.letter.count({ where }),
    ]);

    return apiOk({
      letters,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  }
);

/**
 * POST /api/letters
 * 创建新信件
 */
export const POST = compose(
  withErrorHandling(),
  withAuth(),
  async (request: import('@/lib/middleware').RequestWithContext) => {
    const session = request.context.session!;

    // 只有admin可以创建信件
    if (session.role !== 'admin') {
      return apiError('权限不足', { status: 403 });
    }

    const body = await request.json();
    const validationResult = createLetterSchema.safeParse(body);

    if (!validationResult.success) {
      return apiError('无效的请求数据', {
        status: 400,
        data: validationResult.error.format(),
      });
    }

    const { title, content, recipientId, writtenAt, isPublished, tags } =
      validationResult.data;

    // 创建信件
    const letter = await prisma.letter.create({
      data: {
        title: title ?? null,
        content,
        authorId: session.userId,
        recipientId,
        writtenAt: writtenAt ? new Date(writtenAt) : null,
        isPublished: isPublished ?? true,
        tags: tags ?? null,
      },
      include: {
        author: {
          select: { id: true, role: true },
        },
        recipient: {
          select: { id: true, role: true },
        },
      },
    });

    return apiOk(letter, { status: 201 });
  }
);
