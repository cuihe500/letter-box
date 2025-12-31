import { NextResponse } from 'next/server';

export type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
  error: null;
  message: null;
};

export type ApiErrorResponse<TData = null> = {
  success: false;
  data: TData;
  error: string;
  message: string | null;
};

export type ApiResponse<TSuccessData, TErrorData = null> =
  | ApiSuccessResponse<TSuccessData>
  | ApiErrorResponse<TErrorData>;

function toJsonSafe(value: unknown, seen?: WeakSet<object>): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonSafe(item, seen));
  }

  if (value && typeof value === 'object') {
    if (value instanceof Date) {
      return value;
    }

    // 如果对象本身具备 toJSON（例如 Date/Decimal），交给 JSON 序列化流程处理
    const maybeToJson = (value as { toJSON?: unknown }).toJSON;
    if (typeof maybeToJson === 'function') {
      return value;
    }

    const visited = seen ?? new WeakSet<object>();
    if (visited.has(value)) {
      throw new TypeError('Cannot serialize circular structure to JSON');
    }
    visited.add(value);

    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      result[key] = toJsonSafe(nested, visited);
    }
    return result;
  }

  return value;
}

export function apiOk<TData>(
  data: TData,
  init?: ResponseInit
): NextResponse<ApiSuccessResponse<TData>> {
  return NextResponse.json(
    {
      success: true,
      data: toJsonSafe(data) as TData,
      error: null,
      message: null,
    },
    init
  );
}

type ApiErrorOptions<TData> = Omit<ResponseInit, 'status'> & {
  status?: number;
  message?: string;
  data?: TData;
};

export function apiError<TData = null>(
  error: string,
  options?: ApiErrorOptions<TData>
): NextResponse<ApiErrorResponse<TData>> {
  const { status = 400, message, data, ...init } = options ?? {};
  return NextResponse.json(
    {
      success: false,
      data: toJsonSafe((data ?? null) as TData) as TData,
      error,
      message: message ?? null,
    },
    { status, ...init }
  );
}
