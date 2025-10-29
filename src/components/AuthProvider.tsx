'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService, User } from '@/libs/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    password2: string,
    first_name?: string,
    last_name?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    email?: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  changePassword: (
    oldPassword: string,
    newPassword: string,
    newPassword2: string
  ) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Redirect logic
    const publicPaths = ['/login', '/signup'];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    if (!loading) {
      if (!user && !isPublicPath) {
        // Not authenticated and trying to access protected route
        router.push('/login');
      } else if (user && isPublicPath) {
        // Authenticated and trying to access login/signup
        router.push('/profile');
      }
    }
  }, [user, loading, pathname, router]);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      authService.clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await authService.login(username, password);
    setUser(response.user);
    router.push('/profile');
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    password2: string,
    first_name?: string,
    last_name?: string
  ) => {
    const response = await authService.register(
      username,
      email,
      password,
      password2,
      first_name,
      last_name
    );
    setUser(response.user);
    router.push('/profile');
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    router.push('/login');
  };

  const updateProfile = async (data: {
    email?: string;
    first_name?: string;
    last_name?: string;
  }) => {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
  };

  const changePassword = async (
    oldPassword: string,
    newPassword: string,
    newPassword2: string
  ) => {
    await authService.changePassword(oldPassword, newPassword, newPassword2);
  };

  const deleteAccount = async () => {
    await authService.deleteAccount();
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    const userData = await authService.getProfile();
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
