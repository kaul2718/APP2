import type { Session } from 'next-auth';
import { authErrorHandler } from './authErrorHandler';

export interface ApiRequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: HeadersInit;
  skipAuthHandler?: boolean;
}

export class ApiError extends Error {
  public status?: number;
  public isAuthError?: boolean;
  public isForbiddenError?: boolean;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isAuthError = status === 401;
    this.isForbiddenError = status === 403;
  }
}

function buildUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL no esta configurada');
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  session?: Session | null,
): Promise<T> {
  // 1. Detección preventiva de token expirado en cliente (NextAuth session.error)
  if (session?.error === 'AccessTokenExpired') {
    if (!options.skipAuthHandler) {
      authErrorHandler.handleUnauthorized({
        customMessage: 'Tu sesión ha expirado. Inicia sesión nuevamente para continuar.',
      });
    }
    throw new ApiError('Tu sesión ha expirado. Inicia sesión nuevamente.', 401);
  }

  const headers = new Headers(options.headers ?? {});

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Error: ${response.status}`;

    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        message = Array.isArray(errorBody.message)
          ? errorBody.message.join(', ')
          : errorBody.message;
      }
    } catch {
      // Ignore JSON parse errors and keep the default message.
    }

    // 2. Manejo centralizado y deduplicado de 401 Unauthorized
    if (response.status === 401) {
      if (!options.skipAuthHandler) {
        authErrorHandler.handleUnauthorized({
          customMessage: message !== 'Error: 401' && message !== 'Unauthorized' ? message : undefined,
        });
      }
      throw new ApiError(message, 401);
    }

    // 3. Manejo centralizado de 403 Forbidden (no desautentica)
    if (response.status === 403) {
      if (!options.skipAuthHandler) {
        authErrorHandler.handleForbidden({
          customMessage: message !== 'Error: 403' && message !== 'Forbidden' ? message : undefined,
        });
      }
      throw new ApiError(message, 403);
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
