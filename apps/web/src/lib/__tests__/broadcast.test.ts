import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StreamerMessage } from '../broadcast.js';

describe('broadcast', () => {
  let mockChannel: {
    postMessage: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockChannel = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
    };
    vi.stubGlobal(
      'BroadcastChannel',
      vi.fn(() => mockChannel),
    );
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('sendStreamerUpdate posts message to channel', async () => {
    const { sendStreamerUpdate } = await import('../broadcast.js');
    const message: StreamerMessage = {
      type: 'stats-update',
      payload: {
        wins: 10,
        losses: 5,
        winRate: 0.667,
        currentStreak: 3,
        currentStreakType: 'win',
        deckName: 'Sky Striker',
        gameMode: 'RANK',
      },
    };

    sendStreamerUpdate(message);
    expect(mockChannel.postMessage).toHaveBeenCalledWith(message);
  });

  it('onStreamerUpdate registers message listener and returns unsubscribe', async () => {
    const { onStreamerUpdate } = await import('../broadcast.js');
    const callback = vi.fn();

    const unsubscribe = onStreamerUpdate(callback);
    expect(mockChannel.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));

    unsubscribe();
    expect(mockChannel.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('onStreamerUpdate callback receives message data', async () => {
    const { onStreamerUpdate } = await import('../broadcast.js');
    const callback = vi.fn();

    onStreamerUpdate(callback);

    const handler = mockChannel.addEventListener.mock.calls[0]?.[1] as (
      event: MessageEvent<StreamerMessage>,
    ) => void;
    const message: StreamerMessage = {
      type: 'stats-update',
      payload: {
        wins: 5,
        losses: 3,
        winRate: 0.625,
        currentStreak: 2,
        currentStreakType: 'win',
        deckName: null,
        gameMode: null,
      },
    };

    handler({ data: message } as MessageEvent<StreamerMessage>);
    expect(callback).toHaveBeenCalledWith(message);
  });
});
