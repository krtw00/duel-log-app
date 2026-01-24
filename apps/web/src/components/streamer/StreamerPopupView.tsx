import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StreamerMessage } from '../../lib/broadcast.js';
import { onStreamerUpdate } from '../../lib/broadcast.js';

type StreamerData = StreamerMessage['payload'];

type DisplayItem =
  | 'currentDeck'
  | 'totalDuels'
  | 'winRate'
  | 'firstWinRate'
  | 'secondWinRate'
  | 'coinWinRate'
  | 'firstRate';

type Layout = 'grid' | 'horizontal' | 'vertical';
type Theme = 'dark' | 'light';
type ChromaKey = 'none' | 'green' | 'blue';

function parseSettings() {
  const params = new URLSearchParams(window.location.search);
  const items = (params.get('items') || 'winRate,firstWinRate,secondWinRate,coinWinRate,firstRate')
    .split(',')
    .filter(Boolean) as DisplayItem[];
  const gameMode = params.get('game_mode') || null;
  const statsPeriod = params.get('stats_period') || 'monthly';
  const theme = (params.get('theme') || 'dark') as Theme;
  const layout = (params.get('layout') || 'grid') as Layout;
  const chromakey = (params.get('chromakey') || 'none') as ChromaKey;
  const fromTimestamp = params.get('from_timestamp') || null;
  const refresh = Number(params.get('refresh')) || 30;

  return { items, gameMode, statsPeriod, theme, layout, chromakey, fromTimestamp, refresh };
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function StreamerPopupView() {
  const { t } = useTranslation();
  const [data, setData] = useState<StreamerData | null>(null);
  const settings = useMemo(() => parseSettings(), []);

  const handleMessage = useCallback((message: StreamerMessage) => {
    if (message.type === 'stats-update') {
      setData(message.payload);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onStreamerUpdate(handleMessage);
    return unsubscribe;
  }, [handleMessage]);

  const bgStyle = useMemo(() => {
    switch (settings.chromakey) {
      case 'green':
        return { backgroundColor: '#00FF00' };
      case 'blue':
        return { backgroundColor: '#0000FF' };
      default:
        return settings.theme === 'dark'
          ? { backgroundColor: '#0a0e27' }
          : { backgroundColor: '#f5f5f5' };
    }
  }, [settings.chromakey, settings.theme]);

  const textColor = settings.theme === 'dark' ? '#e4e7ec' : '#1a1a1a';
  const textSecondary = settings.theme === 'dark' ? 'rgba(228,231,236,0.6)' : 'rgba(26,26,26,0.6)';
  const cardBg = settings.theme === 'dark' ? 'rgba(18,22,46,0.8)' : 'rgba(255,255,255,0.9)';
  const cardBorder = settings.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const getItemLabel = (item: DisplayItem): string => {
    switch (item) {
      case 'currentDeck':
        return t('streamer.currentDeck');
      case 'totalDuels':
        return t('streamer.totalDuels');
      case 'winRate':
        return t('streamer.winRate');
      case 'firstWinRate':
        return t('streamer.firstWinRate');
      case 'secondWinRate':
        return t('streamer.secondWinRate');
      case 'coinWinRate':
        return t('streamer.coinWinRate');
      case 'firstRate':
        return t('streamer.firstRate');
    }
  };

  const getItemValue = (item: DisplayItem): string => {
    if (!data) return '-';
    switch (item) {
      case 'currentDeck':
        return data.deckName || '-';
      case 'totalDuels':
        return `${data.totalDuels}`;
      case 'winRate':
        return formatPercent(data.winRate);
      case 'firstWinRate':
        return formatPercent(data.firstWinRate);
      case 'secondWinRate':
        return formatPercent(data.secondWinRate);
      case 'coinWinRate':
        return formatPercent(data.coinTossWinRate);
      case 'firstRate':
        return formatPercent(data.firstRate);
    }
  };

  const getItemColor = (item: DisplayItem): string => {
    switch (item) {
      case 'currentDeck':
        return '#e4e7ec';
      case 'totalDuels':
        return '#00d9ff';
      case 'winRate':
        return '#00e676';
      case 'firstWinRate':
        return '#ffaa00';
      case 'secondWinRate':
        return '#b536ff';
      case 'coinWinRate':
        return '#ffd700';
      case 'firstRate':
        return '#26a69a';
    }
  };

  const layoutClass = useMemo(() => {
    switch (settings.layout) {
      case 'horizontal':
        return 'flex flex-row flex-wrap gap-3';
      case 'vertical':
        return 'flex flex-col gap-3';
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 gap-3';
    }
  }, [settings.layout]);

  return (
    <div className="min-h-screen p-4" style={bgStyle}>
      {/* Game mode & streak badge */}
      {data && (
        <div className="mb-3 flex items-center gap-2">
          {data.gameMode && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{ color: textSecondary, border: `1px solid ${cardBorder}` }}
            >
              {data.gameMode}
            </span>
          )}
          {data.currentStreak >= 2 && data.currentStreakType && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor:
                  data.currentStreakType === 'win'
                    ? 'rgba(0,230,118,0.2)'
                    : 'rgba(255,61,113,0.2)',
                color: data.currentStreakType === 'win' ? '#00e676' : '#ff3d71',
              }}
            >
              {data.currentStreakType === 'win'
                ? t('streak.winStreakShort', { count: data.currentStreak })
                : t('streak.lossStreakShort', { count: data.currentStreak })}
            </span>
          )}
        </div>
      )}

      {/* Stats items */}
      {data ? (
        <div className={layoutClass}>
          {settings.items.map((item) => (
            <div
              key={item}
              className="rounded-xl p-3"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="text-xs mb-1" style={{ color: textSecondary }}>
                {getItemLabel(item)}
              </div>
              <div
                className="text-lg font-bold"
                style={{ color: item === 'currentDeck' ? textColor : getItemColor(item) }}
              >
                {getItemValue(item)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin mx-auto mb-2"
              style={{ borderColor: `${textSecondary}`, borderTopColor: '#00d9ff' }}
            />
            <p className="text-sm" style={{ color: textSecondary }}>
              {t('streamer.receivingStats')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
