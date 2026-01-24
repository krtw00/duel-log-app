import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';
import { MetaAnalysisSection } from './MetaAnalysisSection.js';
import { UserDetailDialog } from './UserDetailDialog.js';

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

type ScanResult = {
  count: number;
};

export function AdminView() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api<{ data: AdminStats }>('/admin/stats'),
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api<{ data: UserItem[] }>('/admin/users'),
  });

  // Maintenance mutations
  const deleteExpiredMutation = useMutation({
    mutationFn: () => api('/admin/shared-links/expired', { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const scanOrphanedDecksMutation = useMutation({
    mutationFn: () => api<{ data: ScanResult }>('/admin/maintenance/orphaned-decks'),
  });

  const cleanupOrphanedDecksMutation = useMutation({
    mutationFn: () => api('/admin/maintenance/orphaned-decks', { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const scanOrphanedUrlsMutation = useMutation({
    mutationFn: () => api<{ data: ScanResult }>('/admin/maintenance/orphaned-shared-urls'),
  });

  const cleanupOrphanedUrlsMutation = useMutation({
    mutationFn: () => api('/admin/maintenance/orphaned-shared-urls', { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const statCards = [
    { label: t('admin.totalUsers'), value: stats?.data.totalUsers ?? 0, color: 'var(--color-primary)' },
    { label: t('admin.totalDuels'), value: stats?.data.totalDuels ?? 0, color: 'var(--color-success)' },
    { label: t('admin.totalDecks'), value: stats?.data.totalDecks ?? 0, color: 'var(--color-secondary)' },
    { label: t('admin.activeToday'), value: stats?.data.activeUsers30d ?? 0, color: 'var(--color-warning)' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-on-bg)' }}>
        {t('admin.title')}
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading
          ? ['s1', 's2', 's3', 's4'].map((id) => (
              <div key={id} className="glass-card p-4 animate-pulse">
                <div className="h-4 rounded w-20 mb-2" style={{ background: 'var(--color-surface-variant)' }} />
                <div className="h-6 rounded w-12" style={{ background: 'var(--color-surface-variant)' }} />
              </div>
            ))
          : statCards.map((card) => (
              <div key={card.label} className="glass-card p-4">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {card.label}
                </p>
                <p className="text-2xl font-bold" style={{ color: card.color }}>
                  {card.value.toLocaleString()}
                </p>
              </div>
            ))}
      </div>

      {/* User List */}
      <section className="glass-card overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-on-surface)' }}>
            {t('admin.userList')}
          </h2>
        </div>
        {usersLoading ? (
          <div className="p-4 space-y-2">
            {['s1', 's2', 's3'].map((id) => (
              <div key={id} className="h-12 rounded animate-pulse" style={{ background: 'var(--color-surface-variant)' }} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="themed-table">
              <thead>
                <tr>
                  <th>{t('profile.displayName')}</th>
                  <th>{t('auth.email')}</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Last Login</th>
                  <th className="text-right">{t('common.edit')}</th>
                </tr>
              </thead>
              <tbody>
                {(users?.data ?? []).map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span style={{ color: 'var(--color-on-surface)' }}>{u.displayName}</span>
                      {u.isAdmin && (
                        <span
                          className="ml-2 text-sm px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(181,54,255,0.15)', color: 'var(--color-secondary)' }}
                        >
                          Admin
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--color-on-surface-muted)' }}>{u.email}</td>
                    <td>
                      <span
                        className="text-sm px-2 py-0.5 rounded"
                        style={
                          u.status === 'active'
                            ? { background: 'rgba(0,230,118,0.15)', color: 'var(--color-success)' }
                            : { background: 'rgba(255,61,113,0.15)', color: 'var(--color-error)' }
                        }
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell" style={{ color: 'var(--color-on-surface-muted)', fontSize: '0.75rem' }}>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '-'}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(u.id)}
                        className="themed-btn themed-btn-ghost p-1"
                        title={t('admin.userDetail')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Maintenance */}
      <section className="glass-card p-4">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-on-surface)' }}>
          {t('admin.maintenance')}
        </h2>
        <div className="space-y-3">
          {/* Expired share links */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
              {t('admin.expiredSharedUrls')}
            </span>
            <button
              type="button"
              onClick={() => deleteExpiredMutation.mutate()}
              disabled={deleteExpiredMutation.isPending}
              className="themed-btn themed-btn-outlined text-sm"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              {t('admin.cleanup')}
            </button>
          </div>

          {/* Orphaned decks */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
              {t('admin.orphanedDecks')}
            </span>
            <button
              type="button"
              onClick={() => scanOrphanedDecksMutation.mutate()}
              disabled={scanOrphanedDecksMutation.isPending}
              className="themed-btn themed-btn-outlined text-sm"
            >
              {t('admin.scan')}
            </button>
            {scanOrphanedDecksMutation.data && (
              <>
                <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                  ({scanOrphanedDecksMutation.data.data.count} found)
                </span>
                {scanOrphanedDecksMutation.data.data.count > 0 && (
                  <button
                    type="button"
                    onClick={() => cleanupOrphanedDecksMutation.mutate()}
                    disabled={cleanupOrphanedDecksMutation.isPending}
                    className="themed-btn themed-btn-outlined text-sm"
                    style={{ color: 'var(--color-error)' }}
                  >
                    {t('admin.cleanup')}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Orphaned shared URLs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
              {t('admin.orphanedSharedUrls')}
            </span>
            <button
              type="button"
              onClick={() => scanOrphanedUrlsMutation.mutate()}
              disabled={scanOrphanedUrlsMutation.isPending}
              className="themed-btn themed-btn-outlined text-sm"
            >
              {t('admin.scan')}
            </button>
            {scanOrphanedUrlsMutation.data && (
              <>
                <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                  ({scanOrphanedUrlsMutation.data.data.count} found)
                </span>
                {scanOrphanedUrlsMutation.data.data.count > 0 && (
                  <button
                    type="button"
                    onClick={() => cleanupOrphanedUrlsMutation.mutate()}
                    disabled={cleanupOrphanedUrlsMutation.isPending}
                    className="themed-btn themed-btn-outlined text-sm"
                    style={{ color: 'var(--color-error)' }}
                  >
                    {t('admin.cleanup')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Meta Analysis */}
      <MetaAnalysisSection />

      {/* User Detail Dialog */}
      {selectedUserId && (
        <UserDetailDialog userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}
