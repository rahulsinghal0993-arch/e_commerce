'use client';

import type { ReactNode } from 'react';
import { ToastContainer } from '@arghya/ui';
import { AuthProvider } from '../context/AuthContext.js';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <ToastContainer />
    </AuthProvider>
  );
}
