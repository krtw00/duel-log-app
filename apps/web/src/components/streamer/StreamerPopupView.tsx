import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';
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
  const gameMode = params.get('game_mode') || 'RANK';
  const statsPeriod = params.get('stats_period') || 'monthly';
  const theme = (params.get('theme') || 'dark') as Theme;
  const layout = (params.get('layout') || 'grid') as Layout;
  const chromakey = (params.get('chromakey') || 'none') as ChromaKey;
  const fromTimestamp = params.get('from_timestamp') || null;

  return { items, gameMode, statsPeriod, theme, layout, chromakey, fromTimestamp };
}

type OverviewData = {
  totalDuels: number;
  wins: number;
  losses: number;
  winRate: number;
  firstRate: number;
  firstWinRate: number;
  secondWinRate: number;
  coinTossWinRate: number;
};

type DuelItem = {
  deckId: string;
};

type DeckItem = {
  id: string;
  name: string;
};

function buildFilterParams(settings: ReturnType<typeof parseSettings>): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {
    gameMode: settings.gameMode,
  };

  if (settings.statsPeriod === 'monthly') {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    params.from = from;
    params.to = to;
  } else if (settings.fromTimestamp) {
    params.fromTimestamp = settings.fromTimestamp;
  }

  return params;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const POLL_INTERVAL = 30_000;
const CONTAINER_PADDING = 16;

export function StreamerPopupView() {
  const { t } = useTranslation();
  const [data, setData] = useState<StreamerData | null>(null);
  const settings = useMemo(() => parseSettings(), []);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statsCardRef = useRef<HTMLDivElement>(null);
  const hasResized = useRef(false);

  const fetchStats = useCallback(async () => {
    try {
      const filterParams = buildFilterParams(settings);

      const [overview, duels, decks] = await Promise.all([
        api<{ data: OverviewData }>('/statistics/overview', { params: filterParams }),
        api<{ data: DuelItem[] }>('/duels', { params: { ...filterParams, limit: '1' } }),
        api<{ data: DeckItem[] }>('/decks'),
      ]);

      const latestDuel = duels.data?.[0];
      const deckName = latestDuel
        ? decks.data.find((d) => d.id === latestDuel.deckId)?.name ?? null
        : null;

      setData({
        totalDuels: overview.data.totalDuels,
        wins: overview.data.wins,
        losses: overview.data.losses,
        winRate: overview.data.winRate,
        firstRate: overview.data.firstRate,
        firstWinRate: overview.data.firstWinRate,
        secondWinRate: overview.data.secondWinRate,
        coinTossWinRate: overview.data.coinTossWinRate,
        deckName,
        gameMode: settings.gameMode,
      });
    } catch {
      // Auth may not be available yet, will retry on next poll
    }
  }, [settings]);

  // Initial fetch + polling
  useEffect(() => {
    fetchStats();
    pollRef.current = setInterval(fetchStats, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchStats]);

  // BroadcastChannel: override polling data when received
  const handleMessage = useCallback((message: StreamerMessage) => {
    if (message.type === 'stats-update') {
      setData(message.payload);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onStreamerUpdate(handleMessage);
    return unsubscribe;
  }, [handleMessage]);

  // 初回データ表示後にウィンドウをコンテンツサイズにリサイズ（grid以外）
  useEffect(() => {
    if (!data || hasResized.current) return;
    if (!window.opener) return;
    if (settings.layout === 'grid') return;

    // レンダリング完了を待つ
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!statsCardRef.current) return;
          const rect = statsCardRef.current.getBoundingClientRect();
          const targetInnerWidth = Math.ceil(rect.width) + CONTAINER_PADDING * 2;
          const targetInnerHeight = Math.ceil(rect.height) + CONTAINER_PADDING * 2;
          const chromeWidth = window.outerWidth - window.innerWidth;
          const chromeHeight = window.outerHeight - window.innerHeight;
          try {
            window.resizeTo(
              targetInnerWidth + chromeWidth,
              targetInnerHeight + chromeHeight,
            );
          } catch {
            // resize may not be allowed
          }
          hasResized.current = true;
        });
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [data, settings.layout]);

  const getItemLabel = (item: DisplayItem): string => {
    switch (item) {
      case 'currentDeck': return t('streamer.currentDeck');
      case 'totalDuels': return t('streamer.totalDuels');
      case 'winRate': return t('streamer.winRate');
      case 'firstWinRate': return t('streamer.firstWinRate');
      case 'secondWinRate': return t('streamer.secondWinRate');
      case 'coinWinRate': return t('streamer.coinWinRate');
      case 'firstRate': return t('streamer.firstRate');
    }
  };

  const getItemValue = (item: DisplayItem): string => {
    if (!data) return '-';
    switch (item) {
      case 'currentDeck': return data.deckName || '-';
      case 'totalDuels': return `${data.totalDuels}`;
      case 'winRate': return formatPercent(data.winRate);
      case 'firstWinRate': return formatPercent(data.firstWinRate);
      case 'secondWinRate': return formatPercent(data.secondWinRate);
      case 'coinWinRate': return formatPercent(data.coinTossWinRate);
      case 'firstRate': return formatPercent(data.firstRate);
    }
  };

  const chromaClass = settings.chromakey !== 'none' ? `chroma-key-${settings.chromakey}` : '';
  const rootClass = `popup-overlay theme-${settings.theme} ${chromaClass}`;

  if (!data) {
    return (
      <div className={rootClass}>
        <div className="popup-loading-container">
          <div className="popup-loading-text">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div
        ref={statsCardRef}
        className={`popup-stats-card layout-${settings.layout}`}
      >
        {settings.items.map((item) => (
          <div
            key={item}
            className={`popup-stat-item ${item === 'currentDeck' ? 'deck-item' : ''}`}
          >
            <div className="popup-stat-content">
              <div className="popup-stat-label">
                {getItemLabel(item)}
              </div>
              <div className={`popup-stat-value ${item === 'currentDeck' ? 'deck-value' : ''}`}>
                {getItemValue(item)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
