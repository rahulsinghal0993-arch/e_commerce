// Thin wrapper around fetch that talks to the Arghya Express backend. Session
// tokens live in HttpOnly cookies the browser manages; this client never
// reads or stores them. It transparently refreshes an expired session once
// per request.
//
// Framework-agnostic: works from a Vite SPA or from Next.js client
// components. Each app supplies its own `baseUrl` (proxy path in dev,
// absolute API origin in production).

function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)nm_csrf=([^;]+)/);
  const value = match?.[1];
  return value ? decodeURIComponent(value) : null;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  formData?: boolean;
  _retry?: boolean;
}

export type RequestFn = <T = unknown>(path: string, options?: RequestOptions) => Promise<T>;

export interface ApiClient {
  request: RequestFn;
  get: <T = unknown>(path: string, opts?: Omit<RequestOptions, 'method'>) => Promise<T>;
  post: <T = unknown>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) => Promise<T>;
  patch: <T = unknown>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) => Promise<T>;
  del: <T = unknown>(path: string, opts?: Omit<RequestOptions, 'method'>) => Promise<T>;
}

export function createApiClient({ baseUrl }: { baseUrl: string }): ApiClient {
  async function request<T = unknown>(
    path: string,
    { method = 'GET', body, auth = false, formData = false, _retry = false }: RequestOptions = {}
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (auth) {
      const csrf = readCsrfToken();
      if (csrf) headers['X-CSRF-Token'] = csrf;
    }

    let payload: BodyInit | undefined;
    if (formData) {
      payload = body as FormData; // FormData sets its own multipart Content-Type + boundary
    } else {
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      payload = body !== undefined ? JSON.stringify(body) : undefined;
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: payload,
      credentials: 'include',
    });

    // Session likely expired — try one silent cookie-based refresh, then replay.
    if (res.status === 401 && auth && !_retry) {
      const ok = await tryRefresh();
      if (ok) return request<T>(path, { method, body, auth, formData, _retry: true });
    }

    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // Non-JSON response (e.g. a proxy/network error page) — leave data null.
        data = null;
      }
    }

    if (!res.ok) {
      const errData = data as { error?: string; details?: unknown } | null;
      throw new ApiError(res.status, errData?.error || res.statusText, errData?.details);
    }
    return data as T;
  }

  // The refresh token rides in an HttpOnly cookie, so no body is needed.
  // Returns false (rather than throwing) so callers can fall back to a
  // logged-out state.
  async function tryRefresh(): Promise<boolean> {
    try {
      await request('/auth/refresh', { method: 'POST' });
      return true;
    } catch {
      return false;
    }
  }

  return {
    request,
    get: (path, opts) => request(path, { ...opts, method: 'GET' }),
    post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
    patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
    del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  };
}
