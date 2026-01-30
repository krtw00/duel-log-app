import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';

type UserDetail = {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  status: string;
  lastLoginAt: string | null;
  totalDuels: number;
  winRate: number;
  totalDecks: number;
};

type Props = {
  userId: string;
  onClose: () => void;
};

export function UserDetailDialog({ userId, onClose }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: () => api<{ data: UserDetail }>(`/admin/users/${userId}`),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api(`/admin/users/${userId}/status`, { method: 'PUT', body: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const adminMutation = useMutation({
    mutationFn: (isAdmin: boolean) =>
      api(`/admin/users/${userId}/admin`, { method: 'PUT', body: { isAdmin } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => api(`/admin/users/${userId}/reset-password`, { method: 'POST' }),
  });

  const detail = user?.data;

  return (
    <div
      className="dialog-overlay"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="button"
      tabIndex={0}
      aria-label="Close dialog"
    >
      <div
        className="dialog-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={() => {}}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-header">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>
            {t('admin.userDetail')}
          </h2>
          <button type="button" onClick={onClose} className="themed-btn themed-btn-ghost p-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="dialog-body">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {/* biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items never reorder */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 rounded"
                  style={{ background: 'var(--color-surface-variant)' }}
                />
              ))}
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* User Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-on-surface)' }}
                  >
                    {detail.displayName}
                  </span>
                  {detail.isAdmin && (
                    <span className="chip chip-outlined-secondary text-sm">Admin</span>
                  )}
                  <span
                    className="text-sm px-2 py-0.5 rounded"
                    style={
                      detail.status === 'active'
                        ? { background: 'rgba(0,230,118,0.15)', color: 'var(--color-success)' }
                        : { background: 'rgba(255,61,113,0.15)', color: 'var(--color-error)' }
                    }
                  >
                    {detail.status}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {detail.email}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  className="text-center p-2 rounded"
                  style={{ background: 'var(--color-surface-variant)' }}
                >
                  <div className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {t('admin.totalDuels')}
                  </div>
                  <div className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                    {detail.totalDuels}
                  </div>
                </div>
                <div
                  className="text-center p-2 rounded"
                  style={{ background: 'var(--color-surface-variant)' }}
                >
                  <div className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {t('dashboard.winRate')}
                  </div>
                  <div className="text-lg font-bold" style={{ color: 'var(--color-success)' }}>
                    {(detail.winRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div
                  className="text-center p-2 rounded"
                  style={{ background: 'var(--color-surface-variant)' }}
                >
                  <div className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {t('admin.totalDecks')}
                  </div>
                  <div className="text-lg font-bold" style={{ color: 'var(--color-secondary)' }}>
                    {detail.totalDecks}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div
                className="space-y-2 pt-2"
                style={{ borderTop: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      statusMutation.mutate(detail.status === 'active' ? 'banned' : 'active')
                    }
                    disabled={statusMutation.isPending}
                    className="themed-btn themed-btn-outlined text-sm"
                  >
                    {t('admin.changeStatus')}: {detail.status === 'active' ? 'Ban' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetPasswordMutation.mutate()}
                    disabled={resetPasswordMutation.isPending}
                    className="themed-btn themed-btn-outlined text-sm"
                  >
                    {t('admin.resetPassword')}
                  </button>
                  <button
                    type="button"
                    onClick={() => adminMutation.mutate(!detail.isAdmin)}
                    disabled={adminMutation.isPending}
                    className="themed-btn themed-btn-outlined text-sm"
                  >
                    {t('admin.toggleAdmin')}: {detail.isAdmin ? 'Revoke' : 'Grant'}
                  </button>
                </div>
                {resetPasswordMutation.isSuccess && (
                  <p className="text-sm" style={{ color: 'var(--color-success)' }}>
                    Password reset email sent.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
