import type { GameMode } from '@duel-log/shared';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';
import { type DisplayItem, type DisplayItemKey, DragDropItems } from '../common/DragDropItems.js';

type Layout = 'grid' | 'horizontal' | 'vertical';
type Theme = 'dark' | 'light';
type StatsPeriod = 'monthly' | 'all';

type ObsSettings = {
  gameMode: GameMode;
  statsPeriod: StatsPeriod;
  theme: Theme;
  layout: Layout;
  refreshInterval: number;
  items: DisplayItem[];
  milestoneGoal: number;
  recentResultsCount: number;
};

const DEFAULT_ITEMS: DisplayItem[] = [
  { key: 'winRate', selected: true },
  { key: 'firstTurnWinRate', selected: true },
  { key: 'secondTurnWinRate', selected: true },
  { key: 'coinWinRate', selected: true },
  { key: 'goFirstRate', selected: true },
  { key: 'currentDeck', selected: false },
  { key: 'gameModeValue', selected: false },
  { key: 'totalDuels', selected: false },
  { key: 'currentStreak', selected: false },
  { key: 'recentResults', selected: false },
  { key: 'sessionGraph', selected: false },
  { key: 'milestone', selected: false },
];

const STORAGE_KEY_OBS = 'duellog.streamerObsSettings';

function loadObsSettings(): ObsSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_OBS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        milestoneGoal: parsed.milestoneGoal ?? 10,
        recentResultsCount: parsed.recentResultsCount ?? 10,
        items: mergeItems(parsed.items),
      };
    }
  } catch {}
  return {
    gameMode: 'RANK',
    statsPeriod: 'monthly',
    theme: 'dark',
    layout: 'grid',
    refreshInterval: 30,
    items: [...DEFAULT_ITEMS],
    milestoneGoal: 10,
    recentResultsCount: 10,
  };
}

/** Merge stored items with DEFAULT_ITEMS to include new item keys */
function mergeItems(stored: DisplayItem[]): DisplayItem[] {
  const storedKeys = new Set(stored.map((i) => i.key));
  const newItems = DEFAULT_ITEMS.filter((i) => !storedKeys.has(i.key));
  return [...stored, ...newItems];
}

/** OBSブラウザソースの推奨サイズをCSSの定義値から計算 */
function getRecommendedObsSize(
  layout: Layout,
  itemCount: number,
): { width: number; height: number } {
  const overlayPadding = 32;
  const itemHeight = 98;

  if (layout === 'horizontal') {
    const cardWidth = 48 + 180 * itemCount + 12 * Math.max(itemCount - 1, 0);
    const cardHeight = 24 + itemHeight;
    return {
      width: Math.ceil((cardWidth + overlayPadding) / 10) * 10,
      height: Math.ceil((cardHeight + overlayPadding) / 10) * 10,
    };
  }

  if (layout === 'vertical') {
    const cardWidth = 224;
    const cardHeight = 24 + itemHeight * itemCount + 12 * Math.max(itemCount - 1, 0);
    return {
      width: Math.ceil((cardWidth + overlayPadding) / 10) * 10,
      height: Math.ceil((cardHeight + overlayPadding) / 10) * 10,
    };
  }

  const cols = Math.min(itemCount, 3);
  const rows = Math.ceil(itemCount / 3);
  const cardWidth = 48 + 200 * cols + 16 * Math.max(cols - 1, 0);
  const cardHeight = 48 + itemHeight * rows + 16 * Math.max(rows - 1, 0);
  return {
    width: Math.ceil((cardWidth + overlayPadding) / 10) * 10,
    height: Math.ceil((cardHeight + overlayPadding) / 10) * 10,
  };
}

export function StreamerView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isStreamerMode = localStorage.getItem('streamerMode') === 'true';

  useEffect(() => {
    if (!isStreamerMode) {
      navigate({ to: '/' });
    }
  }, [isStreamerMode, navigate]);

  const [obsSettings, setObsSettings] = useState<ObsSettings>(loadObsSettings);
  const [obsCopied, setObsCopied] = useState(false);
  const [obsLoading, setObsLoading] = useState(false);

  const getItemLabel = useCallback(
    (key: DisplayItemKey): string => {
      return t(`streamer.items.${key}`);
    },
    [t],
  );

  const saveObsSettings = () => {
    localStorage.setItem(STORAGE_KEY_OBS, JSON.stringify(obsSettings));
  };

  const copyObsUrl = async () => {
    setObsLoading(true);
    try {
      saveObsSettings();
      const { token } = await api<{ token: string }>('/obs/token', { method: 'POST' });
      const selectedItems = obsSettings.items
        .filter((i) => i.selected)
        .map((i) =>
          i.key === 'firstTurnWinRate'
            ? 'firstWinRate'
            : i.key === 'secondTurnWinRate'
              ? 'secondWinRate'
              : i.key === 'goFirstRate'
                ? 'firstRate'
                : i.key,
        )
        .join(',');
      const params = new URLSearchParams({
        token,
        items: selectedItems,
        game_mode: obsSettings.gameMode,
        stats_period: obsSettings.statsPeriod,
        theme: obsSettings.theme,
        layout: obsSettings.layout,
        refresh: String(obsSettings.refreshInterval),
        milestone_goal: String(obsSettings.milestoneGoal),
        recent_count: String(obsSettings.recentResultsCount),
      });
      const url = `${window.location.origin}/obs-overlay?${params.toString()}`;
      await navigator.clipboard.writeText(url);
      setObsCopied(true);
      setTimeout(() => setObsCopied(false), 2000);
    } catch {
      // Failed to generate token
    } finally {
      setObsLoading(false);
    }
  };

  if (!isStreamerMode) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-on-surface)' }}>
        {t('streamer.obsBrowserSource')}
      </h1>

      <div className="glass-card overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
              OBS
            </h2>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Description */}
          <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
            {t('streamer.obsDescription')}
          </p>

          {/* Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label
                className="block text-base font-medium mb-1"
                style={{ color: 'var(--color-on-surface-muted)' }}
              >
                {t('duel.gameMode')}
              </label>
              <select
                value={obsSettings.gameMode}
                onChange={(e) =>
                  setObsSettings({ ...obsSettings, gameMode: e.target.value as GameMode })
                }
                className="themed-select"
              >
                <option value="RANK">{t('gameMode.RANK')}</option>
                <option value="RATE">{t('gameMode.RATE')}</option>
                <option value="EVENT">{t('gameMode.EVENT')}</option>
                <option value="DC">{t('gameMode.DC')}</option>
              </select>
            </div>
            <div>
              <label
                className="block text-base font-medium mb-1"
                style={{ color: 'var(--color-on-surface-muted)' }}
              >
                {t('streamer.settings.statsPeriod')}
              </label>
              <select
                value={obsSettings.statsPeriod}
                onChange={(e) =>
                  setObsSettings({ ...obsSettings, statsPeriod: e.target.value as StatsPeriod })
                }
                className="themed-select"
              >
                <option value="monthly">{t('statistics.monthly')}</option>
                <option value="all">{t('common.all')}</option>
              </select>
            </div>
            <div>
              <label
                className="block text-base font-medium mb-1"
                style={{ color: 'var(--color-on-surface-muted)' }}
              >
                {t('profile.theme')}
              </label>
              <select
                value={obsSettings.theme}
                onChange={(e) => setObsSettings({ ...obsSettings, theme: e.target.value as Theme })}
                className="themed-select"
              >
                <option value="dark">{t('profile.themeDark')}</option>
                <option value="light">{t('profile.themeLight')}</option>
              </select>
            </div>
            <div>
              <label
                className="block text-base font-medium mb-1"
                style={{ color: 'var(--color-on-surface-muted)' }}
              >
                {t('streamer.layoutGrid')}
              </label>
              <select
                value={obsSettings.layout}
                onChange={(e) =>
                  setObsSettings({ ...obsSettings, layout: e.target.value as Layout })
                }
                className="themed-select"
              >
                <option value="grid">{t('streamer.layoutGrid')}</option>
                <option value="horizontal">{t('streamer.layoutHorizontal')}</option>
                <option value="vertical">{t('streamer.layoutVertical')}</option>
              </select>
            </div>
            <div>
              <label
                className="block text-base font-medium mb-1"
                style={{ color: 'var(--color-on-surface-muted)' }}
              >
                {t('statistics.refreshInterval')}
              </label>
              <input
                type="number"
                value={obsSettings.refreshInterval}
                min={5}
                max={300}
                onChange={(e) =>
                  setObsSettings({ ...obsSettings, refreshInterval: Number(e.target.value) })
                }
                className="themed-input"
              />
            </div>
            <div>
              <label
                className="block text-base font-medium mb-1"
                style={{ color: 'var(--color-on-surface-muted)' }}
              >
                {t('streamer.milestoneGoal')}
              </label>
              <input
                type="number"
                value={obsSettings.milestoneGoal}
                min={1}
                max={100}
                onChange={(e) =>
                  setObsSettings({ ...obsSettings, milestoneGoal: Number(e.target.value) })
                }
                className="themed-input"
              />
            </div>
            <div>
              <label
                className="block text-base font-medium mb-1"
                style={{ color: 'var(--color-on-surface-muted)' }}
              >
                {t('streamer.recentResultsCount')}
              </label>
              <input
                type="number"
                value={obsSettings.recentResultsCount}
                min={3}
                max={30}
                onChange={(e) =>
                  setObsSettings({ ...obsSettings, recentResultsCount: Number(e.target.value) })
                }
                className="themed-input"
              />
            </div>
          </div>

          {/* Display Items */}
          <div>
            <label
              className="block text-base font-medium mb-2"
              style={{ color: 'var(--color-on-surface-muted)' }}
            >
              {t('streamer.settings.displayItems')}
            </label>
            <DragDropItems
              items={obsSettings.items}
              onChange={(items) => setObsSettings({ ...obsSettings, items })}
              labelFn={getItemLabel}
            />
          </div>

          {/* OBS Setup Instructions */}
          <div
            className="p-3 rounded-lg text-sm"
            style={{ background: 'var(--color-surface-variant)' }}
          >
            <p className="font-medium mb-2" style={{ color: 'var(--color-on-surface)' }}>
              {t('streamer.obsSetupTitle')}
            </p>
            <ol
              className="list-decimal list-inside space-y-1"
              style={{ color: 'var(--color-on-surface-muted)' }}
            >
              <li>{t('streamer.obsSetupStep1')}</li>
              <li>{t('streamer.obsSetupStep2')}</li>
              <li>
                {t(
                  'streamer.obsSetupStep3',
                  getRecommendedObsSize(
                    obsSettings.layout,
                    obsSettings.items.filter((i) => i.selected).length,
                  ),
                )}
              </li>
            </ol>
          </div>

          {/* OBS URL Copy */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={copyObsUrl}
              disabled={obsLoading}
              className="themed-btn themed-btn-primary text-sm"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {obsLoading ? '...' : obsCopied ? t('common.copied') : t('streamer.getObsUrl')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
