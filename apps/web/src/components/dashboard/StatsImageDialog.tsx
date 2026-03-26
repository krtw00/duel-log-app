import type { DeckWinRate, GameMode, OverviewStats, Streaks } from '@duel-log/shared';
import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStatsImageDownload } from '../../hooks/useStatsImageDownload.js';
import { useNotificationStore } from '../../stores/notificationStore.js';
import { DEFAULT_VISIBILITY, type ImageVisibility, StatsImageCard } from './StatsImageCard.js';

type Props = {
  open: boolean;
  onClose: () => void;
  stats: OverviewStats;
  streaks?: Streaks;
  gameMode: GameMode;
  deckWinRates?: DeckWinRate[];
  rank?: number | null;
  rateValue?: number | null;
};

const STORAGE_KEY = 'duellog.statsImage.visibility';
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 675;
const PREVIEW_SCALE = 0.5;
const PREVIEW_MAX_WIDTH = CARD_WIDTH * PREVIEW_SCALE;

function loadVisibility(): ImageVisibility {
  if (typeof window === 'undefined') {
    return DEFAULT_VISIBILITY;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_VISIBILITY;
    }

    return { ...DEFAULT_VISIBILITY, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_VISIBILITY;
  }
}

export function StatsImageDialog({
  open,
  onClose,
  stats,
  streaks,
  gameMode,
  deckWinRates,
  rank,
  rateValue,
}: Props) {
  const { t } = useTranslation();
  const { download, copyToClipboard, generating } = useStatsImageDownload();
  const { success, error } = useNotificationStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const scaleWrapperRef = useRef<HTMLDivElement>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const [visibility, setVisibility] = useState<ImageVisibility>(() => loadVisibility());
  const [previewScale, setPreviewScale] = useState(PREVIEW_SCALE);
  const showMistakeToggle = stats.playMistakes > 0;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  }, [visibility]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const frame = previewFrameRef.current;
    if (!frame) {
      return undefined;
    }

    const updateScale = () => {
      const nextScale = Math.min(PREVIEW_SCALE, frame.clientWidth / CARD_WIDTH || PREVIEW_SCALE);
      setPreviewScale(nextScale);
    };

    updateScale();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => updateScale());
    observer.observe(frame);
    return () => observer.disconnect();
  }, [open]);

  if (!open) {
    return null;
  }

  const previewHeight = CARD_HEIGHT * previewScale;

  const handleToggle = (key: keyof ImageVisibility) => (event: ChangeEvent<HTMLInputElement>) => {
    setVisibility((current) => ({ ...current, [key]: event.target.checked }));
  };

  const captureWithFullScale = async <T,>(fn: (el: HTMLElement) => Promise<T>) => {
    const card = cardRef.current;
    const wrapper = scaleWrapperRef.current;
    if (!card || !wrapper) return undefined;

    const prev = wrapper.style.transform;
    wrapper.style.transform = 'scale(1)';
    try {
      return await fn(card);
    } finally {
      wrapper.style.transform = prev;
    }
  };

  const handleDownload = async () => {
    await captureWithFullScale((el) => download(el));
  };

  const handleCopy = async () => {
    const copied = await captureWithFullScale((el) => copyToClipboard(el));
    if (copied) {
      success(t('dashboard.statsImageCopied'));
      return;
    }
    if (copied === false) {
      error(t('dashboard.statsImageCopyFailed'));
    }
  };

  return (
    <div
      className="dialog-overlay"
      onClick={onClose}
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
      role="button"
      tabIndex={0}
      aria-label="Close dialog"
    >
      <div
        className="dialog-content"
        style={{ maxWidth: 680 }}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={() => {}}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-header">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>
            {t('dashboard.statsImageTitle')}
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
          <div className="space-y-5">
            <div>
              <div
                className="text-sm font-medium mb-3"
                style={{ color: 'var(--color-on-surface-muted)' }}
              >
                {t('dashboard.statsImageDisplayItems')}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                }}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibility.detailedRates}
                    onChange={handleToggle('detailedRates')}
                    className="accent-[var(--color-primary)]"
                  />
                  <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
                    {t('dashboard.statsImageDetailedRates')}
                  </span>
                </label>
                {showMistakeToggle && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.mistakeStats}
                      onChange={handleToggle('mistakeStats')}
                      className="accent-[var(--color-primary)]"
                    />
                    <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
                      {t('dashboard.statsImageMistakeStats')}
                    </span>
                  </label>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibility.rankRate}
                    onChange={handleToggle('rankRate')}
                    className="accent-[var(--color-primary)]"
                  />
                  <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
                    {t('dashboard.statsImageRankRate')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibility.deckWinRates}
                    onChange={handleToggle('deckWinRates')}
                    className="accent-[var(--color-primary)]"
                  />
                  <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
                    {t('dashboard.statsImageDeckWinRates')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibility.streakBadge}
                    onChange={handleToggle('streakBadge')}
                    className="accent-[var(--color-primary)]"
                  />
                  <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
                    {t('dashboard.statsImageStreakBadge')}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <div
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 16,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-card-bg)',
                  overflow: 'hidden',
                }}
              >
                <div ref={previewFrameRef} style={{ width: '100%', maxWidth: PREVIEW_MAX_WIDTH }}>
                  <div style={{ height: previewHeight }}>
                    <div
                      ref={scaleWrapperRef}
                      style={{
                        width: CARD_WIDTH,
                        height: CARD_HEIGHT,
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'top left',
                      }}
                    >
                      <StatsImageCard
                        ref={cardRef}
                        stats={stats}
                        streaks={streaks}
                        gameMode={gameMode}
                        deckWinRates={deckWinRates}
                        rank={rank}
                        rateValue={rateValue}
                        visibility={visibility}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={generating}
                className="themed-btn themed-btn-outlined"
              >
                {t('dashboard.statsImageDownload')}
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={generating}
                className="themed-btn themed-btn-primary"
              >
                {t('dashboard.statsImageCopy')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
