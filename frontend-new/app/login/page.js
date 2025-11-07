'use client';
import { useState } from 'react';
import { useAuth } from '../src/context/AuthContext.js';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login, register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'login') await login(email, password);
    else await register(email, password);
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">{mode === 'login' ? 'Login' : 'Register'}</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" className="w-full h-10 rounded-md border bg-background px-2 text-sm" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" className="w-full h-10 rounded-md border bg-background px-2 text-sm" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading}>{loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Register')}</Button>
          <Button type="button" variant="outline" onClick={()=> setMode(mode === 'login' ? 'register' : 'login')}>
            Switch to {mode === 'login' ? 'Register' : 'Login'}
          </Button>
        </div>
      </form>
    </main>
  );
}
