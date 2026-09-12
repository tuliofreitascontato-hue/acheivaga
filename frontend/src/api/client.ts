const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export class ApiClientError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function getToken(): string | null {
  return localStorage.getItem('acheivaga_token');
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiClientError(res.status, body.error ?? 'erro inesperado');
  }

  return body as T;
}

export function saveToken(token: string) {
  localStorage.setItem('acheivaga_token', token);
}

export function clearToken() {
  localStorage.removeItem('acheivaga_token');
}

export function hasToken(): boolean {
  return Boolean(getToken());
}
