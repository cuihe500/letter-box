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

export function apiOk<TData>(
  data: TData,
  init?: ResponseInit
): NextResponse<ApiSuccessResponse<TData>> {
  return NextResponse.json(
    { success: true, data, error: null, message: null },
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
      data: (data ?? null) as TData,
      error,
      message: message ?? null,
    },
    { status, ...init }
  );
}
