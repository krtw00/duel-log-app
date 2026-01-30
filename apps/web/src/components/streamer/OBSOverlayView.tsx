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
  recentResults: Array<{ result: 'win' | 'loss'; dueledAt: string }>;
  sessionWins: number;
};

type DisplayItem =
  | 'currentDeck'
  | 'totalDuels'
  | 'winRate'
  | 'firstWinRate'
  | 'secondWinRate'
  | 'coinWinRate'
  | 'firstRate'
  | 'currentStreak'
  | 'recentResults'
  | 'sessionGraph'
  | 'milestone';

type Layout = 'grid' | 'horizontal' | 'vertical';
type Theme = 'dark' | 'light';

function parseSettings() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const gameMode = params.get('game_mode') || 'RANK';
  const statsPeriod = params.get('stats_period') || 'monthly';
  const displayItems = (
    params.get('items') || 'winRate,firstWinRate,secondWinRate,coinWinRate,firstRate'
  )
    .split(',')
    .filter(Boolean) as DisplayItem[];
  const layout = (params.get('layout') || 'horizontal') as Layout;
  const theme = (params.get('theme') || 'dark') as Theme;
  const refresh = Number(params.get('refresh')) || 30;
  const milestoneGoal = Number(params.get('milestone_goal')) || 10;
  const recentCount = Number(params.get('recent_count')) || 10;

  return {
    token,
    gameMode,
    statsPeriod,
    displayItems,
    layout,
    theme,
    refresh,
    milestoneGoal,
    recentCount,
  };
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const WIDE_ITEMS: DisplayItem[] = ['recentResults', 'sessionGraph', 'milestone'];

export function OBSOverlayView() {
  const { t } = useTranslation();
  const [data, setData] = useState<OBSStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const settings = useMemo(() => parseSettings(), []);
  const sessionStartRef = useRef(new Date().toISOString());
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
        recent_count: String(settings.recentCount),
      });
      if (settings.statsPeriod === 'session') {
        params.set('from_timestamp', sessionStartRef.current);
      }
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
      case 'currentStreak':
        return t('streamer.items.currentStreak');
      case 'recentResults':
        return t('streamer.items.recentResults');
      case 'sessionGraph':
        return t('streamer.items.sessionGraph');
      case 'milestone':
        return t('streamer.items.milestone');
    }
  };

  const getItemValue = (item: DisplayItem): string | null => {
    if (!data) return '-';
    switch (item) {
      case 'currentDeck':
        return data.currentDeck || '-';
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
      case 'currentStreak':
      case 'recentResults':
      case 'sessionGraph':
      case 'milestone':
        return null; // rendered by custom JSX
    }
  };

  const renderCurrentStreak = () => {
    if (!data) return <span>-</span>;
    const { currentStreak, currentStreakType } = data;
    if (!currentStreakType || currentStreak === 0)
      return <span style={{ color: 'var(--obs-text-primary)' }}>-</span>;
    const color = currentStreakType === 'win' ? '#00e676' : '#ff3d71';
    const label =
      currentStreakType === 'win'
        ? t('streak.winStreakShort', { count: currentStreak })
        : t('streak.lossStreakShort', { count: currentStreak });
    return <span style={{ fontSize: '28px', fontWeight: 700, color }}>{label}</span>;
  };

  const renderRecentResults = () => {
    if (!data || data.recentResults.length === 0)
      return <span style={{ color: 'var(--obs-text-primary)' }}>-</span>;
    return (
      <div className="obs-recent-results">
        {/* biome-ignore lint/suspicious/noArrayIndexKey: recent results don't have unique IDs */}
        {data.recentResults.map((r, i) => (
          <span key={i} className={`obs-result-mark ${r.result}`}>
            {r.result === 'win' ? '\u25CB' : '\u00D7'}
          </span>
        ))}
      </div>
    );
  };

  const renderSessionGraph = () => {
    if (!data || data.recentResults.length < 2)
      return <span style={{ color: 'var(--obs-text-primary)' }}>-</span>;

    const results = data.recentResults;
    const width = 200;
    const height = 60;
    const padding = 4;

    // Calculate cumulative win rate at each point
    const points: { x: number; y: number }[] = [];
    let wins = 0;
    for (let i = 0; i < results.length; i++) {
      if (results[i]?.result === 'win') wins++;
      const rate = wins / (i + 1);
      const x = padding + (i / (results.length - 1)) * (width - padding * 2);
      const y = padding + (1 - rate) * (height - padding * 2);
      points.push({ x, y });
    }

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const halfY = padding + 0.5 * (height - padding * 2);

    return (
      <svg
        className="obs-session-graph"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* 50% reference line */}
        <line
          x1={padding}
          y1={halfY}
          x2={width - padding}
          y2={halfY}
          stroke="var(--obs-text-secondary)"
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.5"
        />
        {/* Win rate line */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#obs-graph-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="obs-graph-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--obs-gradient-start)" />
            <stop offset="100%" stopColor="var(--obs-gradient-end)" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  const renderMilestone = () => {
    if (!data) return <span style={{ color: 'var(--obs-text-primary)' }}>-</span>;
    const current = data.sessionWins;
    const target = settings.milestoneGoal;
    const percent = Math.min((current / target) * 100, 100);

    return (
      <div className="obs-milestone">
        <div className="obs-milestone-bar">
          <div className="obs-milestone-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="obs-milestone-label">
          {current}/{target}
        </span>
      </div>
    );
  };

  const renderCustomItem = (item: DisplayItem) => {
    switch (item) {
      case 'currentStreak':
        return renderCurrentStreak();
      case 'recentResults':
        return renderRecentResults();
      case 'sessionGraph':
        return renderSessionGraph();
      case 'milestone':
        return renderMilestone();
      default:
        return null;
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
          {settings.displayItems.map((item) => {
            const isWide = WIDE_ITEMS.includes(item);
            const customValue = getItemValue(item);
            const isCustom = customValue === null;

            return (
              <div
                key={item}
                className={`obs-stat-item ${item === 'currentDeck' ? 'deck-item' : ''} ${isWide ? 'wide-item' : ''}`}
              >
                <div className="obs-stat-label">{getItemLabel(item)}</div>
                {isCustom ? (
                  <div className="obs-stat-custom">{renderCustomItem(item)}</div>
                ) : (
                  <div className={`obs-stat-value ${item === 'currentDeck' ? 'deck-value' : ''}`}>
                    {customValue}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
