import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../stores/auth.js';

export function UserMenu() {
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ data: { displayName: string; streamerMode: boolean } }>('/me'),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isStreamerMode = localStorage.getItem('streamerMode') === 'true';
  const displayName = profile?.data?.displayName
    || user?.user_metadata?.display_name
    || user?.user_metadata?.username
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'User';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`chip ${isStreamerMode ? 'chip-secondary' : 'chip-primary'} cursor-pointer`}
      >
        {isStreamerMode ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
        <span className="text-sm font-medium hidden sm:inline">{displayName}</span>
      </button>

      {open && (
        <div className="menu-dropdown">
          <div className="px-4 py-2 text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
            {isStreamerMode ? '********@****.***' : user?.email}
          </div>
          <div className="menu-divider" />
          <Link to="/profile" className="menu-item" onClick={() => setOpen(false)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {t('nav.profile')}
          </Link>
          {user?.user_metadata?.is_admin && (
            <Link to="/admin" className="menu-item" onClick={() => setOpen(false)}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {t('nav.admin')}
            </Link>
          )}
          <div className="menu-divider" />
          <button
            type="button"
            onClick={async () => {
              await signOut();
              queryClient.clear();
              window.location.href = '/login';
            }}
            className="menu-item"
            style={{ color: 'var(--color-error)' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {t('common.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
