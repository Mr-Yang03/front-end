import { API_BASE_URL, ENDPOINTS } from './config';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens?: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
}

class AuthService {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Token management
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  setUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // API calls
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.login}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    
    // Save tokens and user
    this.setTokens(data.tokens.access, data.tokens.refresh);
    this.setUser(data.user);

    return data;
  }

  async register(
    username: string,
    email: string,
    password: string,
    password2: string,
    first_name?: string,
    last_name?: string
  ): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.register}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        username,
        email,
        password,
        password2,
        first_name,
        last_name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || 'Registration failed');
    }

    const data: RegisterResponse = await response.json();

    // Save tokens and user if provided
    if (data.tokens) {
      this.setTokens(data.tokens.access_token, data.tokens.refresh_token);
      this.setUser(data.user);
    }

    return data;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    try {
      if (refreshToken) {
        await fetch(`${API_BASE_URL}${ENDPOINTS.logout}`, {
          method: 'POST',
          headers: this.getHeaders(true),
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.profile}`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.getProfile(); // Retry with new token
        }
        throw new Error('Session expired');
      }
      throw new Error('Failed to fetch profile');
    }

    const user: User = await response.json();
    this.setUser(user);
    return user;
  }

  async updateProfile(data: {
    email?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.profile}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || 'Update failed');
    }

    const user: User = await response.json();
    this.setUser(user);
    return user;
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
    newPassword2: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.changePassword}`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        new_password2: newPassword2,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || 'Password change failed');
    }
  }

  async deleteAccount(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.deleteAccount}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || 'Account deletion failed');
    }

    // Clear tokens after successful deletion
    this.clearTokens();
  }

  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.refreshToken}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      const accessToken = data.access_token || data.tokens?.access_token;
      
      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
