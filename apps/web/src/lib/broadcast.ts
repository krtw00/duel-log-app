const CHANNEL_NAME = 'duel-log-streamer';

export type StreamerMessage = {
  type: 'refresh';
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

export function broadcastStreamerStats(): void {
  sendStreamerUpdate({ type: 'refresh' });
}
