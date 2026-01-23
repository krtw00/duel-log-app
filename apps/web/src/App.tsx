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
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
