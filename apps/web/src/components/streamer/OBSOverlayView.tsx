import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type OBSStats = {
  totalDuels: number;
  wins: number;
  losses: number;
  winRate: number;
  firstRate: number;
  firstWinRate: number;
  secondWinRate: number;
  coinTossWinRate: number;
  currentStreak: number;
  currentStreakType: 'win' | 'loss' | null;
  currentDeck?: string;
};

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

function parseSettings() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const gameMode = params.get('game_mode') || 'RANK';
  const statsPeriod = params.get('stats_period') || 'monthly';
  const displayItems = (params.get('items') || 'winRate,firstWinRate,secondWinRate,coinWinRate,firstRate')
    .split(',')
    .filter(Boolean) as DisplayItem[];
  const layout = (params.get('layout') || 'horizontal') as Layout;
  const theme = (params.get('theme') || 'dark') as Theme;
  const refresh = Number(params.get('refresh')) || 30;

  return { token, gameMode, statsPeriod, displayItems, layout, theme, refresh };
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function OBSOverlayView() {
  const { t } = useTranslation();
  const [data, setData] = useState<OBSStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const settings = useMemo(() => parseSettings(), []);
  const dataRef = useRef<OBSStats | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const naturalSizeRef = useRef<{ width: number; height: number } | null>(null);
  const [scale, setScale] = useState(1);

  // OBSブラウザソースで背景透過させるためにbody/htmlを透明化
  useEffect(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
  }, []);

  const fetchStats = useCallback(async () => {
    if (!settings.token) {
      setError(t('streamer.invalidToken'));
      return;
    }
    try {
      const params = new URLSearchParams({
        token: settings.token,
        game_mode: settings.gameMode,
        stats_period: settings.statsPeriod,
      });
      const response = await fetch(`/api/obs/stats?${params.toString()}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const errCode = (body as { error?: { code?: string } }).error?.code;
        if (errCode === 'INVALID_TOKEN') {
          setError(t('streamer.invalidToken'));
        } else if (!dataRef.current) {
          setError(t('streamer.invalidToken'));
        }
        return;
      }
      const result = (await response.json()) as { data: OBSStats };
      setData(result.data);
      dataRef.current = result.data;
      setError(null);
    } catch {
      if (!dataRef.current) {
        setError(t('streamer.invalidToken'));
      }
    }
  }, [settings, t]);

  useEffect(() => {
    fetchStats();
    const intervalId = setInterval(fetchStats, settings.refresh * 1000);
    return () => clearInterval(intervalId);
  }, [fetchStats, settings.refresh]);

  // ビューポートサイズに合わせてコンテンツを自動スケーリング（初回のみ計測）
  useEffect(() => {
    if (!data || !cardRef.current || naturalSizeRef.current) return;

    const measure = () => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      naturalSizeRef.current = { width: rect.width, height: rect.height };

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const padding = 16;
      const sx = (vw - padding * 2) / rect.width;
      const sy = (vh - padding * 2) / rect.height;
      setScale(Math.max(Math.min(sx, sy, 5), 0.1));
    };

    // 初回レンダリング完了待ち
    const timer = setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(measure));
    }, 50);

    return () => clearTimeout(timer);
  }, [data]);

  // ビューポートリサイズ時にスケール再計算
  useEffect(() => {
    const handleResize = () => {
      if (!naturalSizeRef.current) return;
      const { width, height } = naturalSizeRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const padding = 16;
      const sx = (vw - padding * 2) / width;
      const sy = (vh - padding * 2) / height;
      setScale(Math.max(Math.min(sx, sy, 5), 0.1));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      case 'currentDeck': return data.currentDeck || '-';
      case 'totalDuels': return `${data.totalDuels}`;
      case 'winRate': return formatPercent(data.winRate);
      case 'firstWinRate': return formatPercent(data.firstWinRate);
      case 'secondWinRate': return formatPercent(data.secondWinRate);
      case 'coinWinRate': return formatPercent(data.coinTossWinRate);
      case 'firstRate': return formatPercent(data.firstRate);
    }
  };

  const rootClass = `obs-overlay layout-${settings.layout} theme-${settings.theme}`;

  if (error) {
    return (
      <div className={rootClass}>
        <div className="obs-error-container">
          <div className="obs-error-text">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={rootClass}>
        <div className="obs-loading-container">
          <div className="obs-loading-text">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div className="obs-stats-container">
        <div
          ref={cardRef}
          className={`obs-stats-card layout-${settings.layout}`}
          style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
        >
          {settings.displayItems.map((item) => (
            <div
              key={item}
              className={`obs-stat-item ${item === 'currentDeck' ? 'deck-item' : ''}`}
            >
              <div className="obs-stat-label">
                {getItemLabel(item)}
              </div>
              <div className={`obs-stat-value ${item === 'currentDeck' ? 'deck-value' : ''}`}>
                {getItemValue(item)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
