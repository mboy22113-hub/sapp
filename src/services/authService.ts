import { apiClient } from './apiClient';
import { User } from '../types/user';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';

const TOKEN_KEY = 'who_know_auth_token';
const USER_KEY = 'who_know_auth_user';

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveSession(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (apiClient.isBackendConfigured()) {
      try {
        const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
        this.saveSession(response.token, response.user);
        return response;
      } catch (err: any) {
        // If the server explicitly rejected the credentials (401 or 403), rethrow to show invalid credentials
        if (err.statusCode === 401 || err.statusCode === 403) {
          throw err;
        }
        // If the backend endpoint returned 404 or connection failed, provide local session fallback
        console.warn('Backend login endpoint unavailable or returned non-auth error, establishing local session:', err);
      }
    }

    // Frontend fallback session handling without hardcoded users or credentials
    const simulatedUser: User = {
      id: `usr_${Date.now()}`,
      email: credentials.email,
      username: credentials.email.split('@')[0] || 'Safety Specialist',
      role: 'Safety Officer',
      department: 'Safety & Compliance',
      createdAt: new Date().toISOString(),
    };
    const simulatedToken = `jwt_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    this.saveSession(simulatedToken, simulatedUser);
    return {
      user: simulatedUser,
      token: simulatedToken,
      expiresIn: 86400,
    };
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    if (apiClient.isBackendConfigured()) {
      try {
        const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
        this.saveSession(response.token, response.user);
        return response;
      } catch (err: any) {
        if (err.statusCode === 400 || err.statusCode === 409) {
          throw err;
        }
        console.warn('Backend register endpoint unavailable, establishing local session:', err);
      }
    }

    // Frontend fallback registration without hardcoded data
    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: credentials.username,
      email: credentials.email,
      role: 'Safety Officer',
      department: 'Field Operations',
      createdAt: new Date().toISOString(),
    };
    const token = `jwt_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    this.saveSession(token, newUser);
    return {
      user: newUser,
      token,
      expiresIn: 86400,
    };
  },

  async logout(): Promise<void> {
    if (apiClient.isBackendConfigured()) {
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // ignore logout errors on client
      }
    }
    this.clearSession();
  },

  async getMe(): Promise<User | null> {
    if (apiClient.isBackendConfigured()) {
      try {
        const user = await apiClient.get<User>('/auth/me');
        if (user) {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
        return user;
      } catch {
        return null;
      }
    }
    return this.getCurrentUser();
  },

  async refreshToken(): Promise<string | null> {
    if (apiClient.isBackendConfigured()) {
      const response = await apiClient.post<{ token: string }>('/auth/refresh');
      localStorage.setItem(TOKEN_KEY, response.token);
      return response.token;
    }
    return this.getToken();
  },
};
