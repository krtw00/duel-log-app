import type { CreateDuel, Duel } from '@duel-log/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../lib/api.js';
import { broadcastStreamerStats } from '../../lib/broadcast.js';
import { useCreateDuel, useDeleteDuel } from '../useDuels.js';

const notificationState = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock('../../lib/api.js', () => ({
  api: vi.fn(),
}));

vi.mock('../../lib/broadcast.js', () => ({
  broadcastStreamerStats: vi.fn(),
}));

vi.mock('../../stores/notificationStore.js', () => ({
  useNotificationStore: () => notificationState,
}));

vi.mock('../../stores/auth.js', () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: '00000000-0000-0000-0000-000000000001' } }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

type DuelListResponse = {
  data: Duel[];
  pagination: { total: number; limit: number; offset: number };
};

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const baseDuel: Duel = {
  id: '11111111-1111-1111-1111-111111111111',
  userId: '00000000-0000-0000-0000-000000000001',
  deckId: '22222222-2222-2222-2222-222222222222',
  opponentDeckId: '33333333-3333-3333-3333-333333333333',
  result: 'win',
  gameMode: 'RANK',
  isFirst: true,
  wonCoinToss: true,
  rank: 1,
  rateValue: null,
  dcValue: null,
  memo: null,
  dueledAt: '2026-02-01T00:00:00.000Z',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
};

const createData: CreateDuel = {
  deckId: '22222222-2222-2222-2222-222222222222',
  opponentDeckId: '33333333-3333-3333-3333-333333333333',
  result: 'win',
  gameMode: 'RANK',
  isFirst: true,
  wonCoinToss: false,
  rank: 1,
  rateValue: null,
  dcValue: null,
  memo: null,
  dueledAt: '2026-02-01T00:00:01.000Z',
};

describe('useDuels optimistic updates', () => {
  const apiMock = vi.mocked(api);
  const broadcastMock = vi.mocked(broadcastStreamerStats);
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    notificationState.success.mockClear();
    notificationState.error.mockClear();
    apiMock.mockReset();
    broadcastMock.mockReset();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('optimistically inserts a duel and replaces it on success', async () => {
    const filter = { gameMode: 'RANK', limit: 50, offset: 0 };
    const otherFilter = { gameMode: 'EVENT', limit: 50, offset: 0 };
    const key: [string, typeof filter] = ['duels', filter];
    const otherKey: [string, typeof otherFilter] = ['duels', otherFilter];

    queryClient.setQueryData<DuelListResponse>(key, {
      data: [baseDuel],
      pagination: { total: 1, limit: 50, offset: 0 },
    });
    queryClient.setQueryData<DuelListResponse>(otherKey, {
      data: [{ ...baseDuel, id: '44444444-4444-4444-4444-444444444444', gameMode: 'EVENT' }],
      pagination: { total: 1, limit: 50, offset: 0 },
    });

    let resolveApi: (value: { data: Duel }) => void;
    const apiPromise = new Promise<{ data: Duel }>((resolve) => {
      resolveApi = resolve;
    });
    apiMock.mockReturnValueOnce(apiPromise);

    const { result } = renderHook(() => useCreateDuel(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(createData);
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<DuelListResponse>(key);
      expect(cached?.data[0]?.id).toMatch(/^temp-/);
      expect(cached?.pagination.total).toBe(2);
    });

    const untouched = queryClient.getQueryData<DuelListResponse>(otherKey);
    expect(untouched?.data[0]?.gameMode).toBe('EVENT');

    const created: Duel = {
      ...baseDuel,
      id: '55555555-5555-5555-5555-555555555555',
      dueledAt: createData.dueledAt,
      createdAt: '2026-02-01T00:00:02.000Z',
      updatedAt: '2026-02-01T00:00:02.000Z',
    };
    if (!resolveApi) {
      throw new Error('resolveApi not set');
    }
    resolveApi({ data: created });

    await waitFor(() => {
      const cached = queryClient.getQueryData<DuelListResponse>(key);
      expect(cached?.data[0]?.id).toBe(created.id);
    });
    expect(notificationState.success).toHaveBeenCalledWith('duel.registered');
    expect(broadcastMock).toHaveBeenCalled();
  });

  it('rolls back optimistic create when the request fails', async () => {
    const filter = { gameMode: 'RANK', limit: 50, offset: 0 };
    const key: [string, typeof filter] = ['duels', filter];
    const original: DuelListResponse = {
      data: [baseDuel],
      pagination: { total: 1, limit: 50, offset: 0 },
    };
    queryClient.setQueryData<DuelListResponse>(key, original);

    apiMock.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useCreateDuel(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(createData);
    });

    await waitFor(() => {
      expect(notificationState.error).toHaveBeenCalledWith('duel.registerFailed');
    });

    const cached = queryClient.getQueryData<DuelListResponse>(key);
    expect(cached).toEqual(original);
  });

  it('optimistically removes a duel on delete', async () => {
    const filter = { gameMode: 'RANK', limit: 50, offset: 0 };
    const key: [string, typeof filter] = ['duels', filter];
    const targetId = baseDuel.id;
    const secondDuel: Duel = {
      ...baseDuel,
      id: '66666666-6666-6666-6666-666666666666',
    };
    queryClient.setQueryData<DuelListResponse>(key, {
      data: [baseDuel, secondDuel],
      pagination: { total: 2, limit: 50, offset: 0 },
    });

    apiMock.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDeleteDuel(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(targetId);
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<DuelListResponse>(key);
      expect(cached?.data.find((duel) => duel.id === targetId)).toBeUndefined();
      expect(cached?.pagination.total).toBe(1);
    });
    expect(notificationState.success).toHaveBeenCalledWith('duel.deleted');
  });

  it('restores the duel when delete fails', async () => {
    const filter = { gameMode: 'RANK', limit: 50, offset: 0 };
    const key: [string, typeof filter] = ['duels', filter];
    const original: DuelListResponse = {
      data: [baseDuel],
      pagination: { total: 1, limit: 50, offset: 0 },
    };
    queryClient.setQueryData<DuelListResponse>(key, original);

    apiMock.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useDeleteDuel(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(baseDuel.id);
    });

    await waitFor(() => {
      expect(notificationState.error).toHaveBeenCalledWith('duel.deleteFailed');
    });

    const cached = queryClient.getQueryData<DuelListResponse>(key);
    expect(cached).toEqual(original);
  });
});
