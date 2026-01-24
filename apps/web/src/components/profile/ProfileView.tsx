import type { UpdateUser } from '@duel-log/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../stores/auth.js';

export function ProfileView() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [streamerMode, setStreamerMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await api<{
          data: { displayName: string; streamerMode: boolean };
        }>('/me');
        setDisplayName(result.data.displayName);
        setStreamerMode(result.data.streamerMode);
      } catch {
        // ignore
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      setMessage(t('profile.passwordMismatch'));
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const data: UpdateUser = { displayName, streamerMode };
      await api('/me', { method: 'PATCH', body: data });
      setMessage(t('profile.saved'));
      setMessageType('success');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage(t('profile.saveFailed'));
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await api('/me', { method: 'DELETE' });
      window.location.href = '/';
    } catch {
      setMessage(t('profile.deleteFailed'));
      setMessageType('error');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-on-bg)' }}>
        {t('profile.title')}
      </h1>

      {/* Profile Card */}
      <div className="glass-card overflow-hidden">
        <div className="glow-line-top" />
        <div className="p-6 space-y-4">
          {/* Email (readonly) */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {t('auth.email')}
              </span>
            </label>
            <p className="text-sm py-2" style={{ color: 'var(--color-on-surface)' }}>
              {streamerMode ? '***@***.***' : (user?.email ?? '-')}
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {t('profile.displayName')}
              </span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="themed-input"
            />
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {t('auth.newPassword')}
              </span>
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="themed-input"
              placeholder="••••••••"
            />
          </div>

          {/* Confirm Password */}
          {newPassword && (
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <polyline points="9 16 11 18 15 14" />
                  </svg>
                  {t('auth.passwordConfirm')}
                </span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="themed-input"
                placeholder="••••••••"
              />
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--color-border)', margin: '16px 0' }} />

          {/* Streamer Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                  {t('profile.streamerMode')}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {t('profile.streamerModeDesc')}
                </p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={streamerMode}
                onChange={(e) => setStreamerMode(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {/* Message */}
          {message && (
            <p className="text-sm" style={{ color: messageType === 'error' ? 'var(--color-error)' : 'var(--color-success)' }}>
              {message}
            </p>
          )}

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="themed-btn themed-btn-primary w-full"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>

      {/* Delete Account Card */}
      <div className="glass-card overflow-hidden" style={{ border: '1px solid rgba(255,72,72,0.5)' }}>
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-error)' }}>
              {t('profile.deleteAccount')}
            </h2>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>
            {t('profile.deleteWarning')}
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="themed-btn w-full"
            style={{ background: 'var(--color-error)', color: '#fff' }}
          >
            {t('profile.deleteAccount')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="dialog-overlay" onClick={() => setShowDeleteDialog(false)} onKeyDown={(e) => e.key === 'Escape' && setShowDeleteDialog(false)} role="button" tabIndex={0} aria-label="Close">
          <div className="dialog-content" onClick={(e) => e.stopPropagation()} onKeyDown={() => {}} role="dialog" tabIndex={-1}>
            <div className="dialog-header">
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-error)' }}>
                {t('profile.deleteAccount')}
              </h2>
            </div>
            <div className="dialog-body space-y-4">
              <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                {t('profile.deleteConfirmText')}
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="themed-input"
                placeholder="DELETE"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowDeleteDialog(false)} className="themed-btn themed-btn-ghost">
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || deleting}
                  className="themed-btn"
                  style={{ background: 'var(--color-error)', color: '#fff', opacity: deleteConfirm !== 'DELETE' ? 0.5 : 1 }}
                >
                  {deleting ? t('common.loading') : t('profile.deleteAccount')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
