import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

type AdminStats = {
  totalUsers: number;
  totalDuels: number;
  totalDecks: number;
  activeUsers30d: number;
};

type UserItem = {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  status: string;
  lastLoginAt: string | null;
};

export function AdminView() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api<{ data: AdminStats }>('/admin/stats'),
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api<{ data: UserItem[] }>('/admin/users'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">管理者パネル</h1>

      {/* 統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          ['s1', 's2', 's3', 's4'].map((id) => (
            <div key={id} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-12" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="総ユーザー数" value={stats?.data.totalUsers ?? 0} />
            <StatCard label="総対戦数" value={stats?.data.totalDuels ?? 0} />
            <StatCard label="総デッキ数" value={stats?.data.totalDecks ?? 0} />
            <StatCard label="30日間アクティブ" value={stats?.data.activeUsers30d ?? 0} />
          </>
        )}
      </div>

      {/* ユーザー一覧 */}
      <section>
        <h2 className="text-lg font-semibold mb-3">ユーザー一覧</h2>
        {usersLoading ? (
          <div className="animate-pulse space-y-2">
            {['s1', 's2', 's3'].map((id) => (
              <div key={id} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">表示名</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">メール</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">ステータス</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">最終ログイン</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(users?.data ?? []).map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {u.displayName}
                      {u.isAdmin && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          u.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ja-JP') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}
