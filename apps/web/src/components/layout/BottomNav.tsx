import { Link, useLocation } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

type BottomNavProps = {
  onFabClick: () => void;
};

export function BottomNav({ onFabClick }: BottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav md:hidden">
      <Link to="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        <span>{t('nav.dashboard')}</span>
      </Link>

      <Link to="/statistics" className={`bottom-nav-item ${isActive('/statistics') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <span>{t('nav.statistics')}</span>
      </Link>

      <button type="button" className="bottom-nav-fab" onClick={onFabClick}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <Link to="/decks" className={`bottom-nav-item ${isActive('/decks') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <span>{t('nav.decks')}</span>
      </Link>

      <Link to="/profile" className={`bottom-nav-item ${isActive('/profile') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>{t('nav.profile')}</span>
      </Link>
    </nav>
  );
}
