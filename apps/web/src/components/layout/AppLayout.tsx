import { Link, Outlet } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/auth.js';

export function AppLayout() {
  const { user, signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Duel Log
            </Link>
            <nav className="flex gap-4">
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium"
              >
                ダッシュボード
              </Link>
              <Link
                to="/decks"
                className="text-sm text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium"
              >
                デッキ
              </Link>
              <Link
                to="/statistics"
                className="text-sm text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium"
              >
                統計
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/profile" className="text-sm text-gray-600 hover:text-gray-900">
              {user?.email}
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
