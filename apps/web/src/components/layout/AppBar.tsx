import { Link, useLocation } from '@tanstack/react-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../LanguageSwitcher.js';
import { ThemeToggle } from '../ThemeToggle.js';
import { UserMenu } from './UserMenu.js';

export function AppBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Track AppBar height and update CSS variable
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => {
      const height = header.offsetHeight;
      document.documentElement.style.setProperty('--appbar-height', `${height}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (feedbackRef.current && !feedbackRef.current.contains(e.target as Node)) {
        setFeedbackOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isStreamerMode = localStorage.getItem('streamerMode') === 'true';

  const navItems = [
    { to: '/', label: t('nav.dashboard') },
    { to: '/decks', label: t('nav.decks') },
    { to: '/statistics', label: t('nav.statistics') },
    ...(isStreamerMode ? [{ to: '/streamer', label: t('nav.streamer') }] : []),
  ] as const;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const logo = (
    <Link to="/" className="flex items-center gap-0.5 text-lg font-bold tracking-tight">
      <span style={{ color: '#00d9ff' }}>DUEL</span>
      <span style={{ color: '#b536ff' }}>LOG</span>
    </Link>
  );

  const navLinks = (
    <nav className="hidden md:flex items-center gap-1">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`tab-item ${isActive(item.to) ? 'active' : ''}`}
          style={{ padding: '6px 14px', borderRadius: '6px' }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 z-40">
      <div
        className="px-4 py-3 grid grid-cols-3 items-center"
        style={{
          background: 'var(--color-card-bg)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {/* Left: Logo */}
        <div className="flex items-center">{logo}</div>

        {/* Center: Nav */}
        <div className="flex justify-center">{navLinks}</div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-1">
          <LanguageSwitcher />
          <ThemeToggle />

          {/* Feedback Menu */}
          <div className="relative" ref={feedbackRef}>
            <button
              type="button"
              onClick={() => setFeedbackOpen(!feedbackOpen)}
              className="feedback-btn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="hidden sm:inline">{t('nav.feedback')}</span>
            </button>
            {feedbackOpen && (
              <div className="menu-dropdown">
                <Link
                  to="/feedback"
                  search={{ tab: 'bug' }}
                  className="menu-item"
                  onClick={() => setFeedbackOpen(false)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {t('feedback.categoryBug')}
                </Link>
                <Link
                  to="/feedback"
                  search={{ tab: 'feature' }}
                  className="menu-item"
                  onClick={() => setFeedbackOpen(false)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  {t('feedback.categoryFeature')}
                </Link>
                <div className="menu-divider" />
                <a
                  href="https://x.com/XrIGT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-item"
                  onClick={() => setFeedbackOpen(false)}
                >
                  <span className="text-sm font-bold">𝕏</span>
                  @XrIGT
                </a>
                <a
                  href="https://github.com/krtw00/duel-log-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-item"
                  onClick={() => setFeedbackOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              </div>
            )}
          </div>

          <UserMenu />
        </div>
      </div>

      {/* Glow Line */}
      <div className="glow-line" />
    </header>
  );
}
