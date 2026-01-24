import { RouterProvider } from '@tanstack/react-router';
import { useEffect } from 'react';
import { router } from './routes/index.js';
import { useAuthStore } from './stores/auth.js';

export function App() {
  const { initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-dark-1">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
