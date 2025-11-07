'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, TokenResponse, UserLogin, UserRegister } from '@/lib/types';
import { getAccessToken, getUser, setAuth, clearAuth, isAuthenticated } from '@/lib/auth';
import * as api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  register: (data: UserRegister) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = getUser();
    if (storedUser && isAuthenticated()) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: UserLogin) => {
    const tokens = await api.login(credentials);
    // Extract user info from token (JWT payload) - temporary solution
    // In production, you'd decode the JWT or call a /me endpoint
    try {
      const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
      const userData: User = {
        userId: payload.user_id || '',
        email: payload.email || credentials.email,
        username: payload.username || credentials.email.split('@')[0],
      };
      setAuth(tokens, userData);
      setUser(userData);
    } catch (error) {
      // Fallback if token decode fails
      const userData: User = {
        userId: '',
        email: credentials.email,
        username: credentials.email.split('@')[0],
      };
      setAuth(tokens, userData);
      setUser(userData);
    }
  };

  const register = async (data: UserRegister) => {
    await api.register(data);
    // Auto-login after registration
    await login({ email: data.email, password: data.password });
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    // Optionally call logout endpoint
    api.logout().catch(console.error);
  };

  const refreshToken = async () => {
    try {
      const tokens = await api.refreshToken();
      setAuth(tokens, user || undefined);
    } catch (error) {
      // Refresh failed, logout user
      logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && isAuthenticated(),
        isLoading,
        login,
        register,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

