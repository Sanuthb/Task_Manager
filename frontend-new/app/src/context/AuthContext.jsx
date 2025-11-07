// frontend-new/context/auth-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  token: string | null;
  user: { email: string } | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    // Client-side access to localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  });
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      localStorage.setItem('access_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('access_token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      setToken(res.data.access_token);
      setUser({ email });
      router.push('/dashboard/tasks'); // Redirect upon successful login
      return true;
    } catch (error) {
       console.error("Login failed:", error);
       return false;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const register = useCallback(async (email, password) => {
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { email, password });
      return await login(email, password);
    } catch (error) {
       console.error("Registration failed:", error);
       setLoading(false);
       return false;
    }
  }, [login]);

  const logout = useCallback(() => { 
    setToken(null); 
    setUser(null); 
    router.push('/login');
  }, [router]);

  const value = useMemo(() => ({ token, user, loading, login, register, logout, isAuthenticated: !!token }), [token, user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};