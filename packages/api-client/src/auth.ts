import type { RequestFn } from './client.js';
import type { User } from './types.js';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role?: 'customer' | 'seller';
}

export interface AuthResponse {
  user: User;
}

export function createAuthApi({ request }: { request: RequestFn }) {
  return {
    async register({ email, password, fullName, role = 'customer' }: RegisterInput): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { email, password, fullName, role },
      });
    },
    async login(email: string, password: string): Promise<User> {
      const data = await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      return data.user;
    },
    // Exchange a browser-side OAuth (Google) session for our shaped session.
    // mode: 'login' | 'signup'; role (signup only) is the chosen account type.
    async oauthSession(
      session: unknown,
      { mode, role }: { mode: 'login' | 'signup'; role?: 'customer' | 'seller' }
    ): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/oauth/session', {
        method: 'POST',
        body: { session, mode, role },
      });
    },
    async me(): Promise<User> {
      const data = await request<AuthResponse>('/auth/me', { auth: true });
      return data.user;
    },
    async logout(): Promise<void> {
      try {
        await request('/auth/logout', { method: 'POST', auth: true });
      } catch {
        // The local UI signs out regardless of whether the server was reachable.
      }
    },
    async updateProfile(patch: Partial<Pick<User, 'fullName' | 'avatarUrl'>> & Record<string, unknown>): Promise<User> {
      const data = await request<AuthResponse>('/auth/profile', { method: 'PATCH', body: patch, auth: true });
      return data.user;
    },
    async uploadAvatar(file: File): Promise<User> {
      const form = new FormData();
      form.append('avatar', file);
      const data = await request<AuthResponse>('/auth/profile/avatar', {
        method: 'POST',
        body: form,
        auth: true,
        formData: true,
      });
      return data.user;
    },
    async changePassword({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }): Promise<unknown> {
      return request('/auth/password', {
        method: 'POST',
        body: { currentPassword, newPassword },
        auth: true,
      });
    },
    async changeEmail(newEmail: string): Promise<User> {
      const data = await request<AuthResponse>('/auth/email', { method: 'POST', body: { newEmail }, auth: true });
      return data.user;
    },
  };
}
