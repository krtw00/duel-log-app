import type { GameMode } from '@duel-log/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';

type DisplayItemKey =
  | 'currentDeck'
  | 'gameModeValue'
  | 'totalDuels'
  | 'winRate'
  | 'firstTurnWinRate'
  | 'secondTurnWinRate'
  | 'coinWinRate'
  | 'goFirstRate';

type DisplayItem = {
  key: DisplayItemKey;
  selected: boolean;
};

type Layout = 'grid' | 'horizontal' | 'vertical';
type Theme = 'dark' | 'light';
type ChromaKey = 'none' | 'green' | 'blue';
type StatsPeriod = 'monthly' | 'all';

type PopupSettings = {
  gameMode: GameMode;
  statsPeriod: StatsPeriod;
  theme: Theme;
  layout: Layout;
  chromakey: ChromaKey;
  items: DisplayItem[];
};

type ObsSettings = {
  gameMode: GameMode;
  statsPeriod: StatsPeriod;
  theme: Theme;
  layout: Layout;
  refreshInterval: number;
  items: DisplayItem[];
};

/** OBSブラウザソースの推奨サイズをCSSの定義値から計算 */
function getRecommendedObsSize(layout: Layout, itemCount: number): { width: number; height: number } {
  const overlayPadding = 32; // 16px × 2
  const itemHeight = 98; // padding(16×2) + label(~20) + margin(8) + value(~38)

  if (layout === 'horizontal') {
    // card: padding 24×2, gap 12, item min-width 180
    const cardWidth = 48 + 180 * itemCount + 12 * Math.max(itemCount - 1, 0);
    const cardHeight = 24 + itemHeight; // card padding 12×2
    return {
      width: Math.ceil((cardWidth + overlayPadding) / 10) * 10,
      height: Math.ceil((cardHeight + overlayPadding) / 10) * 10,
    };
  }

  if (layout === 'vertical') {
    // card: padding 12×2, gap 12, item width ~200
    const cardWidth = 224;
    const cardHeight = 24 + itemHeight * itemCount + 12 * Math.max(itemCount - 1, 0);
    return {
      width: Math.ceil((cardWidth + overlayPadding) / 10) * 10,
      height: Math.ceil((cardHeight + overlayPadding) / 10) * 10,
    };
  }

  // grid: 3 columns (200px each), gap 16, padding 24
  const cols = Math.min(itemCount, 3);
  const rows = Math.ceil(itemCount / 3);
  const cardWidth = 48 + 200 * cols + 16 * Math.max(cols - 1, 0);
  const cardHeight = 48 + itemHeight * rows + 16 * Math.max(rows - 1, 0);
  return {
    width: Math.ceil((cardWidth + overlayPadding) / 10) * 10,
    height: Math.ceil((cardHeight + overlayPadding) / 10) * 10,
  };
}

const DEFAULT_ITEMS: DisplayItem[] = [
  { key: 'winRate', selected: true },
  { key: 'firstTurnWinRate', selected: true },
  { key: 'secondTurnWinRate', selected: true },
  { key: 'coinWinRate', selected: true },
  { key: 'goFirstRate', selected: true },
  { key: 'currentDeck', selected: false },
  { key: 'gameModeValue', selected: false },
  { key: 'totalDuels', selected: false },
];

const STORAGE_KEY_POPUP = 'duellog.streamerPopupSettings';
const STORAGE_KEY_OBS = 'duellog.streamerObsSettings';

function loadPopupSettings(): PopupSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_POPUP);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    gameMode: 'RANK',
    statsPeriod: 'monthly',
    theme: 'dark',
    layout: 'grid',
    chromakey: 'none',
    items: [...DEFAULT_ITEMS],
  };
}

function loadObsSettings(): ObsSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_OBS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    gameMode: 'RANK',
    statsPeriod: 'monthly',
    theme: 'dark',
    layout: 'grid',
    refreshInterval: 30,
    items: [...DEFAULT_ITEMS],
  };
}

function DragDropItems({
  items,
  onChange,
  labelFn,
}: {
  items: DisplayItem[];
  onChange: (items: DisplayItem[]) => void;
  labelFn: (key: DisplayItemKey) => string;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragging(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (index: number) => () => {
    setDragOver(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetIndex: number) => () => {
    if (dragging === null || dragging === targetIndex) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const newItems = [...items];
    const removed = newItems.splice(dragging, 1);
    if (removed[0]) {
      newItems.splice(targetIndex, 0, removed[0]);
    }
    onChange(newItems);
    setDragging(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  const toggleItem = (index: number) => {
    const newItems = [...items];
    const item = newItems[index];
    if (item) {
      newItems[index] = { ...item, selected: !item.selected };
      onChange(newItems);
    }
  };

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div
          key={item.key}
          draggable
          onDragStart={handleDragStart(index)}
          onDragEnter={handleDragEnter(index)}
          onDragOver={handleDragOver}
          onDrop={handleDrop(index)}
          onDragEnd={handleDragEnd}
          className={`display-item-compact ${dragging === index ? 'dragging' : ''} ${dragOver === index && dragging !== index ? 'drag-over' : ''}`}
        >
          <span className="drag-handle-compact">⋮⋮</span>
          <input
            type="checkbox"
            checked={item.selected}
            onChange={() => toggleItem(index)}
            className="accent-[var(--color-primary)]"
          />
          <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
            {labelFn(item.key)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StreamerSection() {
  const { t } = useTranslation();
  const isStreamerMode = localStorage.getItem('streamerMode') === 'true';
  const [expandedPanel, setExpandedPanel] = useState<'popup' | 'obs' | null>('popup');

  // Popup settings
  const [popupSettings, setPopupSettings] = useState<PopupSettings>(loadPopupSettings);
  const [popupDirty, setPopupDirty] = useState(false);
  const savedPopupRef = useRef<string>(JSON.stringify(loadPopupSettings()));

  // OBS settings
  const [obsSettings, setObsSettings] = useState<ObsSettings>(loadObsSettings);
  const [obsCopied, setObsCopied] = useState(false);

  // Track dirty state for popup
  useEffect(() => {
    setPopupDirty(JSON.stringify(popupSettings) !== savedPopupRef.current);
  }, [popupSettings]);

  const getItemLabel = useCallback((key: DisplayItemKey): string => {
    return t(`streamer.items.${key}`);
  }, [t]);

  // Save popup settings
  const savePopupSettings = () => {
    localStorage.setItem(STORAGE_KEY_POPUP, JSON.stringify(popupSettings));
    savedPopupRef.current = JSON.stringify(popupSettings);
    setPopupDirty(false);
  };

  // Save OBS settings
  const saveObsSettings = () => {
    localStorage.setItem(STORAGE_KEY_OBS, JSON.stringify(obsSettings));
  };

  // Open popup window
  const openPopup = () => {
    savePopupSettings();
    const selectedItems = popupSettings.items
      .filter((i) => i.selected)
      .map((i) => i.key === 'firstTurnWinRate' ? 'firstWinRate' : i.key === 'secondTurnWinRate' ? 'secondWinRate' : i.key === 'goFirstRate' ? 'firstRate' : i.key)
      .join(',');
    const params = new URLSearchParams({
      items: selectedItems,
      game_mode: popupSettings.gameMode,
      stats_period: popupSettings.statsPeriod,
      theme: popupSettings.theme,
      layout: popupSettings.layout,
      chromakey: popupSettings.chromakey,
    });

    // セッション統計モード（all）の場合、現在時刻の1分前をfrom_timestampとして渡す
    if (popupSettings.statsPeriod === 'all') {
      const timestamp = new Date(Date.now() - 60 * 1000);
      params.set('from_timestamp', timestamp.toISOString());
    }

    // レイアウトに応じたウィンドウサイズ
    let width = 1200;
    let height = 120;
    if (popupSettings.layout === 'vertical') {
      width = 250;
      height = 600;
    } else if (popupSettings.layout === 'grid') {
      width = 900;
      height = 400;
    }

    window.open(
      `/streamer-popup?${params.toString()}`,
      'streamer-popup',
      `width=${width},height=${height},menubar=no,toolbar=no,resizable=yes`,
    );
  };

  // Generate OBS URL with JWT token
  const [obsLoading, setObsLoading] = useState(false);

  const copyObsUrl = async () => {
    setObsLoading(true);
    try {
      saveObsSettings();
      const { token } = await api<{ token: string }>('/obs/token', { method: 'POST' });
      const selectedItems = obsSettings.items
        .filter((i) => i.selected)
        .map((i) => i.key === 'firstTurnWinRate' ? 'firstWinRate' : i.key === 'secondTurnWinRate' ? 'secondWinRate' : i.key === 'goFirstRate' ? 'firstRate' : i.key)
        .join(',');
      const params = new URLSearchParams({
        token,
        items: selectedItems,
        game_mode: obsSettings.gameMode,
        stats_period: obsSettings.statsPeriod,
        theme: obsSettings.theme,
        layout: obsSettings.layout,
        refresh: String(obsSettings.refreshInterval),
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

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
            {t('streamer.popupWindow')}
          </h2>
        </div>
      </div>

      {/* Popup Window Settings */}
      <div className="p-4 space-y-4">
            {/* Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-base font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {t('duel.gameMode')}
                </label>
                <select
                  value={popupSettings.gameMode}
                  onChange={(e) => setPopupSettings({ ...popupSettings, gameMode: e.target.value as GameMode })}
                  className="themed-select"
                >
                  <option value="RANK">{t('gameMode.RANK')}</option>
                  <option value="RATE">{t('gameMode.RATE')}</option>
                  <option value="EVENT">{t('gameMode.EVENT')}</option>
                  <option value="DC">{t('gameMode.DC')}</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {t('streamer.settings.statsPeriod')}
                </label>
                <select
                  value={popupSettings.statsPeriod}
                  onChange={(e) => setPopupSettings({ ...popupSettings, statsPeriod: e.target.value as StatsPeriod })}
                  className="themed-select"
                >
                  <option value="monthly">{t('statistics.monthly')}</option>
                  <option value="all">{t('common.all')}</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {t('profile.theme')}
                </label>
                <select
                  value={popupSettings.theme}
                  onChange={(e) => setPopupSettings({ ...popupSettings, theme: e.target.value as Theme })}
                  className="themed-select"
                >
                  <option value="dark">{t('profile.themeDark')}</option>
                  <option value="light">{t('profile.themeLight')}</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {t('streamer.layoutGrid')}
                </label>
                <select
                  value={popupSettings.layout}
                  onChange={(e) => setPopupSettings({ ...popupSettings, layout: e.target.value as Layout })}
                  className="themed-select"
                >
                  <option value="grid">{t('streamer.layoutGrid')}</option>
                  <option value="horizontal">{t('streamer.layoutHorizontal')}</option>
                  <option value="vertical">{t('streamer.layoutVertical')}</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {t('streamer.chromaKey')}
                </label>
                <select
                  value={popupSettings.chromakey}
                  onChange={(e) => setPopupSettings({ ...popupSettings, chromakey: e.target.value as ChromaKey })}
                  className="themed-select"
                >
                  <option value="none">{t('streamer.chromaKeyNone')}</option>
                  <option value="green">{t('streamer.chromaKeyGreen')}</option>
                  <option value="blue">{t('streamer.chromaKeyBlue')}</option>
                </select>
              </div>
            </div>

            {/* Display Items */}
            <div>
              <label className="block text-base font-medium mb-2" style={{ color: 'var(--color-on-surface-muted)' }}>
                {t('streamer.settings.displayItems')}
              </label>
              <DragDropItems
                items={popupSettings.items}
                onChange={(items) => setPopupSettings({ ...popupSettings, items })}
                labelFn={getItemLabel}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {popupDirty && (
                <span className="mr-auto text-sm" style={{ color: 'var(--color-warning)' }}>
                  {t('streamer.settings.unsavedChanges')}
                </span>
              )}
              <button type="button" onClick={savePopupSettings} className="themed-btn themed-btn-outlined text-sm">
                {t('streamer.settings.saveSettings')}
              </button>
              <button type="button" onClick={openPopup} className="themed-btn themed-btn-primary text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                {t('streamer.settings.openPopup')}
              </button>
            </div>
      </div>

      {/* Panel 2: OBS Browser Source (Deprecated, streamer mode only) */}
      {isStreamerMode && <div className="expansion-panel">
        <button
          type="button"
          className="expansion-header w-full"
          onClick={() => setExpandedPanel(expandedPanel === 'obs' ? null : 'obs')}
        >
          <span className="flex-1 text-left text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
            {t('streamer.obsBrowserSource')}
          </span>
          <span className="chip chip-warning text-sm">{t('streamer.deprecated')}</span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: expandedPanel === 'obs' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {expandedPanel === 'obs' && (
          <div className="expansion-content space-y-4">
            {/* Description */}
            <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
              {t('streamer.obsDescription')}
            </p>

            {/* Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-base font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {t('duel.gameMode')}
                </label>
                <select
                  value={obsSettings.gameMode}
                  onChange={(e) => setObsSettings({ ...obsSettings, gameMode: e.target.value as GameMode })}
                  className="themed-select"
                >
                  <option value="RANK">{t('gameMode.RANK')}</option>
                  <option value="RATE">{t('gameMode.RATE')}</option>
                  <option value="EVENT">{t('gameMode.EVENT')}</option>
                  <option value="DC">{t('gameMode.DC')}</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {t('streamer.settings.statsPeriod')}
                </label>
                <select
                  value={obsSettings.statsPeriod}
                  onChange={(e) => setObsSettings({ ...obsSettings, statsPeriod: e.target.value as StatsPeriod })}
                  className="themed-select"
                >
                  <option value="monthly">{t('statistics.monthly')}</option>
                  <option value="all">{t('common.all')}</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
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
                <label className="block text-base font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {t('streamer.layoutGrid')}
                </label>
                <select
                  value={obsSettings.layout}
                  onChange={(e) => setObsSettings({ ...obsSettings, layout: e.target.value as Layout })}
                  className="themed-select"
                >
                  <option value="grid">{t('streamer.layoutGrid')}</option>
                  <option value="horizontal">{t('streamer.layoutHorizontal')}</option>
                  <option value="vertical">{t('streamer.layoutVertical')}</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {t('statistics.refreshInterval')}
                </label>
                <input
                  type="number"
                  value={obsSettings.refreshInterval}
                  min={5}
                  max={300}
                  onChange={(e) => setObsSettings({ ...obsSettings, refreshInterval: Number(e.target.value) })}
                  className="themed-input"
                />
              </div>
            </div>

            {/* Display Items */}
            <div>
              <label className="block text-base font-medium mb-2" style={{ color: 'var(--color-on-surface-muted)' }}>
                {t('streamer.settings.displayItems')}
              </label>
              <DragDropItems
                items={obsSettings.items}
                onChange={(items) => setObsSettings({ ...obsSettings, items })}
                labelFn={getItemLabel}
              />
            </div>

            {/* OBS Setup Instructions */}
            <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--color-surface-variant)' }}>
              <p className="font-medium mb-2" style={{ color: 'var(--color-on-surface)' }}>
                {t('streamer.obsSetupTitle')}
              </p>
              <ol className="list-decimal list-inside space-y-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                <li>{t('streamer.obsSetupStep1')}</li>
                <li>{t('streamer.obsSetupStep2')}</li>
                <li>{t('streamer.obsSetupStep3', getRecommendedObsSize(
                  obsSettings.layout,
                  obsSettings.items.filter((i) => i.selected).length,
                ))}</li>
              </ol>
            </div>

            {/* OBS URL Copy */}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={copyObsUrl} disabled={obsLoading} className="themed-btn themed-btn-primary text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {obsLoading ? '...' : obsCopied ? t('common.copied') : t('streamer.getObsUrl')}
              </button>
            </div>
          </div>
        )}
      </div>}
    </div>
  );
}
