'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Initialize context with an undefined default value
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  // Use a function for initial state to correctly check localStorage once
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  });
  
  const [user, setUser] = useState(null); // { email: string } or null
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Sync token state with localStorage and axios headers
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
      router.push('/dashboard/tasks'); // Redirect to tasks dashboard after login (updated from the original '/')
      return true;
    } catch (e) {
      console.error('Login failed:', e);
      // Optional: Set an error state here if needed
      return false;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const register = useCallback(async (email, password) => {
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { email, password });
      // Automatically log in the user after successful registration
      return await login(email, password);
    } catch (e) {
      console.error('Registration failed:', e);
      setLoading(false);
      // Optional: Set an error state here if needed
      return false;
    }
  }, [login]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    router.push('/login'); // Redirect to login page after logout (updated from the original '/')
  }, [router]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ 
    token, 
    user, 
    loading, 
    login, 
    register, 
    logout, 
    isAuthenticated: !!token 
  }), [token, user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}