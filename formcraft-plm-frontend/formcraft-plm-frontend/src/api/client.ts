const API_BASE_URL = '/api';

const TOKEN_KEY = 'formcraft_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  isForm?: boolean;
  rawResponse?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.isForm) {
      body = options.body as FormData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body,
  });

  if (res.status === 401) {
    clearToken();
    if (onUnauthorized) onUnauthorized();
    throw new ApiError('Session expired — please log in again', 401);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const problem = await res.json();
      message = problem.detail || problem.message || message;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (options.rawResponse) {
    return res as unknown as T;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form, isForm: true }),
  raw: (path: string) => request<Response>(path, { rawResponse: true }),
};
