'use client';
import { AuthProvider } from './src/context/AuthContext.js';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
