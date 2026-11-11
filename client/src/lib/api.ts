import { clientEnv } from './env';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${clientEnv.VITE_API_URL}${path}`, {
    method: options.method ?? (options.body ? 'POST' : 'GET'),
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string; code?: string };
  };

  if (!response.ok) {
    throw new ApiError(
      payload.error?.message ?? 'Request failed',
      response.status,
      payload.error?.code ?? 'REQUEST_FAILED',
    );
  }

  return payload as T;
}
