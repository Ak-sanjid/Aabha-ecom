/**
 * Browser API client. Always same-origin (`/api/...`) so cookies stay
 * first-party and the sandbox/preview proxy works without CORS.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (typeof body === 'object' && body && 'message' in body
        ? Array.isArray((body as { message: unknown }).message)
          ? ((body as { message: string[] }).message ?? []).join(', ')
          : String((body as { message: unknown }).message)
        : 'Request failed') || 'Request failed';
    throw new ApiError(message, response.status, body);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ---- Auth contracts shared with the backend --------------------------------

export interface IdentifyResult {
  identifierKind: 'email' | 'phone' | 'unknown';
  normalized: string;
  exists: boolean;
  nextStep: 'PASSWORD' | 'OTP' | 'REGISTER' | 'INVALID';
  hasPassword: boolean;
  linkedProviders: string[];
  maskedHint?: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  role: string;
  locale: 'EN' | 'BN';
  mustChangePassword: boolean;
  isNewAccount: boolean;
}

export interface AuthResult {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  notice?: {
    kind: 'GUEST_ACCOUNT_CREATED' | 'ACCOUNT_LINKED' | 'PASSWORD_CHANGE_REQUIRED';
    messageEn: string;
    messageBn: string;
  };
}

export const authApi = {
  identify: (identifier: string) => api.post<IdentifyResult>('/auth/identify', { identifier }),
  login: (identifier: string, password: string) =>
    api.post<AuthResult>('/auth/login', { identifier, password }),
  register: (payload: {
    identifier: string;
    fullName: string;
    password: string;
    locale?: 'EN' | 'BN';
  }) => api.post<AuthResult>('/auth/register', payload),
  requestOtp: (phone: string) =>
    api.post<{ sent: boolean; expiresInSeconds: number; devCode?: string }>('/auth/otp/request', {
      phone,
    }),
  verifyOtp: (phone: string, code: string, fullName?: string) =>
    api.post<AuthResult>('/auth/otp/verify', { phone, code, fullName }),
  forgotPassword: (identifier: string, channel: 'EMAIL' | 'WHATSAPP') =>
    api.post<{ sent: boolean }>('/auth/forgot-password', { identifier, channel }),
  providers: () => api.get<{ google: boolean; facebook: boolean }>('/auth/providers'),
  me: () => api.get<AuthUser>('/auth/me'),
  logout: () => api.post<{ ok: true }>('/auth/logout'),
};
