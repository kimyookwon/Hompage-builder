import { ApiResponse, ApiError } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

// 로컬스토리지에서 JWT 토큰 가져오기
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// 기본 fetch 래퍼 — 인증 헤더 자동 주입
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> | ApiError = await response.json();

  if (!response.ok || !data.success) {
    const error = data as ApiError;
    throw new Error(error.error ?? '알 수 없는 오류가 발생했습니다.');
  }

  return data as ApiResponse<T>;
}

export const api = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'DELETE',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),

  // multipart/form-data 업로드 (Content-Type 헤더 브라우저 자동 설정)
  upload: <T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> => {
    const token = getToken();
    return fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      const data = await res.json() as ApiResponse<T> | ApiError;
      if (!res.ok || !data.success) {
        throw new Error((data as ApiError).error ?? '업로드에 실패했습니다.');
      }
      return data as ApiResponse<T>;
    });
  },
};
