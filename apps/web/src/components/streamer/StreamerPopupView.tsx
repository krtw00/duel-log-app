import type { OverviewStats } from '@duel-log/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';
import type { StreamerMessage } from '../../lib/broadcast.js';
import { onStreamerUpdate } from '../../lib/broadcast.js';
import { StatsDisplayCards } from '../dashboard/StatsDisplayCards.js';

type Theme = 'dark' | 'light';
type ChromaKey = 'none' | 'green' | 'blue';

function parseSettings() {
  const params = new URLSearchParams(window.location.search);
  const gameMode = params.get('game_mode') || 'RANK';
  const statsPeriod = params.get('stats_period') || 'monthly';
  const theme = (params.get('theme') || 'dark') as Theme;
  const chromakey = (params.get('chromakey') || 'none') as ChromaKey;

  return { gameMode, statsPeriod, theme, chromakey };
}

function buildFilterParams(
  settings: ReturnType<typeof parseSettings>,
): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {
    gameMode: settings.gameMode,
  };

  if (settings.statsPeriod === 'monthly') {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    params.from = from;
    params.to = to;
  }

  return params;
}

const POLL_INTERVAL = 30_000;
// 縦一列レイアウトが崩れない最小サイズ
const MIN_WIDTH = 200;
const MIN_HEIGHT = 180;
// 縦一列(<640) → グリッド3列(640-1023) → 横一列(≥1024)
const POPUP_GRID = 'grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3';

export function StreamerPopupView() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const settings = useMemo(() => parseSettings(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasResized = useRef(false);

  // 初回データ表示時にウィンドウ高さをコンテンツに合わせる
  useEffect(() => {
    if (!stats || hasResized.current || !containerRef.current) return;
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const contentHeight = containerRef.current.scrollHeight;
        const chromeH = window.outerHeight - window.innerHeight;
        const targetOuterH = contentHeight + chromeH;
        if (window.outerHeight > targetOuterH) {
          window.resizeTo(window.outerWidth, targetOuterH);
        }
        hasResized.current = true;
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [stats]);

  // ウィンドウ最小サイズ制限
  useEffect(() => {
    const enforce = () => {
      const chromeW = window.outerWidth - window.innerWidth;
      const chromeH = window.outerHeight - window.innerHeight;
      const minOuterW = MIN_WIDTH + chromeW;
      const minOuterH = MIN_HEIGHT + chromeH;
      if (window.outerWidth < minOuterW || window.outerHeight < minOuterH) {
        window.resizeTo(
          Math.max(window.outerWidth, minOuterW),
          Math.max(window.outerHeight, minOuterH),
        );
      }
    };
    window.addEventListener('resize', enforce);
    return () => window.removeEventListener('resize', enforce);
  }, []);

  // テーマをdocumentElementに反映（stat-cardのCSS変数を有効化）
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [settings.theme]);

  // クロマキー背景設定
  useEffect(() => {
    if (settings.chromakey === 'green') {
      document.body.style.background = '#00ff00';
    } else if (settings.chromakey === 'blue') {
      document.body.style.background = '#0000ff';
    } else {
      document.body.style.background = 'var(--color-background)';
    }
  }, [settings.chromakey]);

  const fetchStats = useCallback(async () => {
    try {
      const filterParams = buildFilterParams(settings);
      const overview = await api<{ data: OverviewStats }>('/statistics/overview', {
        params: filterParams,
      });
      setStats(overview.data);
    } catch {
      // Auth may not be available yet, will retry on next poll
    }
  }, [settings]);

  // Initial fetch + polling
  useEffect(() => {
    fetchStats();
    const intervalId = setInterval(fetchStats, POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchStats]);

  // BroadcastChannel: override polling data when received
  const handleMessage = useCallback((message: StreamerMessage) => {
    if (message.type === 'stats-update') {
      const p = message.payload;
      setStats({
        totalDuels: p.totalDuels,
        wins: p.wins,
        losses: p.losses,
        winRate: p.winRate,
        firstRate: p.firstRate,
        firstWinRate: p.firstWinRate,
        secondWinRate: p.secondWinRate,
        coinTossWinRate: p.coinTossWinRate,
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onStreamerUpdate(handleMessage);
    return unsubscribe;
  }, [handleMessage]);

  if (!stats) {
    return (
      <div className="p-4">
        <div className="text-center" style={{ color: 'var(--color-on-surface-muted)' }}>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-4">
      <StatsDisplayCards stats={stats} gridClassName={POPUP_GRID} />
    </div>
  );
}
