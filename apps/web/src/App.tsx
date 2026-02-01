import { RouterProvider } from '@tanstack/react-router';
import { useEffect } from 'react';
import { MaintenancePage } from './components/MaintenancePage.js';
import { router } from './routes/index.js';
import { useAuthStore } from './stores/auth.js';

const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').filter(Boolean);
const MAINTENANCE_BYPASS_KEY = import.meta.env.VITE_MAINTENANCE_BYPASS_KEY || '';

// URLパラメータでバイパスキーをチェック
const urlParams = new URLSearchParams(window.location.search);
const bypassKeyFromUrl = urlParams.get('bypass');
if (bypassKeyFromUrl && bypassKeyFromUrl === MAINTENANCE_BYPASS_KEY) {
  sessionStorage.setItem('maintenance_bypass', 'true');
}
const hasUrlBypass = sessionStorage.getItem('maintenance_bypass') === 'true';

export function App() {
  const { user, initialize, loading } = useAuthStore();

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

  // メンテナンスモード（管理者またはバイパスキーでスキップ）
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  if (MAINTENANCE_MODE && !isAdmin && !hasUrlBypass) {
    return <MaintenancePage />;
  }

  return <RouterProvider router={router} />;
}
