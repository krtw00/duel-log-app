import type { GameMode } from '@duel-log/shared';
import { useTranslation } from 'react-i18next';

type StreamerSectionProps = {
  gameMode: GameMode;
};

export function StreamerSection({ gameMode }: StreamerSectionProps) {
  const { t } = useTranslation();

  const openPopup = () => {
    const isLight = document.documentElement.classList.contains('light');

    const params = new URLSearchParams({
      game_mode: gameMode,
      stats_period: 'monthly',
      theme: isLight ? 'light' : 'dark',
    });

    window.open(
      `/streamer-popup?${params.toString()}`,
      'streamer-popup',
      'width=800,height=300,menubar=no,toolbar=no,resizable=yes',
    );
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 flex items-center gap-2">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth="2"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
          {t('streamer.popupWindow')}
        </span>
        <button type="button" onClick={openPopup} className="themed-btn themed-btn-primary text-sm">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          {t('streamer.settings.openPopup')}
        </button>
      </div>
    </div>
  );
}
