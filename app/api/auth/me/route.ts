import { compose, withErrorHandling, withAuth } from '@/lib/middleware';
import { apiOk } from '@/lib/api/response';

export const GET = compose(
  withErrorHandling(),
  withAuth(),
  async (request: import('@/lib/middleware').RequestWithContext) => {
    const session = request.context.session!;

    return apiOk({ authenticated: true, role: session.role });
  }
);
