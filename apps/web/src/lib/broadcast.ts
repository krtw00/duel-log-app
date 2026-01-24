import { api } from './api.js';

const CHANNEL_NAME = 'duel-log-streamer';

export type StreamerMessage = {
  type: 'stats-update';
  payload: {
    totalDuels: number;
    wins: number;
    losses: number;
    winRate: number;
    firstRate: number;
    firstWinRate: number;
    secondWinRate: number;
    coinTossWinRate: number;
    deckName: string | null;
    gameMode: string | null;
  };
};

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function sendStreamerUpdate(message: StreamerMessage): void {
  try {
    getChannel().postMessage(message);
  } catch {
    // BroadcastChannel not supported
  }
}

export function onStreamerUpdate(callback: (message: StreamerMessage) => void): () => void {
  try {
    const ch = getChannel();
    const handler = (event: MessageEvent<StreamerMessage>) => {
      callback(event.data);
    };
    ch.addEventListener('message', handler);
    return () => ch.removeEventListener('message', handler);
  } catch {
    return () => {};
  }
}

type PopupSettings = {
  gameMode: string;
  statsPeriod: string;
};

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

type DuelData = {
  deckId: string;
};

type DeckData = {
  id: string;
  name: string;
};

function buildFilterParams(settings: PopupSettings): Record<string, string | undefined> {
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

export async function broadcastStreamerStats(): Promise<void> {
  try {
    const stored = localStorage.getItem('duellog.streamerPopupSettings');
    if (!stored) return;

    const settings: PopupSettings = JSON.parse(stored);
    const filterParams = buildFilterParams(settings);

    const [overview, duels, decks] = await Promise.all([
      api<{ data: OverviewData }>('/statistics/overview', { params: filterParams }),
      api<{ data: DuelData[] }>('/duels', { params: { ...filterParams, limit: '1' } }),
      api<{ data: DeckData[] }>('/decks'),
    ]);

    const latestDuel = duels.data?.[0];
    const deckName = latestDuel
      ? decks.data.find((d) => d.id === latestDuel.deckId)?.name ?? null
      : null;

    sendStreamerUpdate({
      type: 'stats-update',
      payload: {
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
      },
    });
  } catch {
    // Silently fail - streamer update is best-effort
  }
}
