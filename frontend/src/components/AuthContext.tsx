// components/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  email: string;
  name?: string;
  credits: number;
  ai_tokens: number;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check for existing token in localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const authRes = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const authData = await authRes.json();

        if (!authData.user) {
          localStorage.removeItem('authToken');
          setLoading(false);
          return;
        }

        const creditsRes = await fetch('/api/user/credits', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const creditsData = await creditsRes.json();

        setUser({
          ...authData.user,
          credits: creditsData?.credits ?? 0,
          ai_tokens: creditsData?.ai_tokens ?? creditsData?.tokens ?? authData.user?.ai_tokens ?? 0,
        });
      } catch (error) {
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('authToken', data.token);

    setUser({
      ...data.user,
      credits: data.user?.credits ?? 0,
      ai_tokens: data.user?.ai_tokens ?? data.user?.tokens ?? 0,
    });
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('authToken', data.token);

    setUser({
      ...data.user,
      credits: data.user?.credits ?? 0,
      ai_tokens: data.user?.ai_tokens ?? data.user?.tokens ?? 50,
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};