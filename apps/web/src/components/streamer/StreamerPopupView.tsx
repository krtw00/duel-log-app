import { useEffect, useState } from 'react';
import { type StreamerMessage, onStreamerUpdate } from '../../lib/broadcast.js';

type StreamerData = StreamerMessage['payload'];

export function StreamerPopupView() {
  const [data, setData] = useState<StreamerData | null>(null);
  const [chromaKey, setChromaKey] = useState(false);

  useEffect(() => {
    const unsubscribe = onStreamerUpdate((message) => {
      if (message.type === 'stats-update') {
        setData(message.payload);
      }
    });
    return unsubscribe;
  }, []);

  const bgClass = chromaKey ? 'bg-green-500' : 'bg-gray-900';

  return (
    <div className={`min-h-screen ${bgClass} p-4`}>
      {/* 設定 */}
      <div className="mb-4 flex justify-end">
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={chromaKey}
            onChange={(e) => setChromaKey(e.target.checked)}
          />
          クロマキー
        </label>
      </div>

      {/* 統計表示 */}
      {data ? (
        <div className="space-y-3">
          {data.deckName && <div className="text-white text-sm opacity-80">{data.deckName}</div>}

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {data.wins}-{data.losses}
            </span>
            <span className="text-lg text-white/70">({(data.winRate * 100).toFixed(1)}%)</span>
          </div>

          {data.currentStreak > 0 && data.currentStreakType && (
            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                data.currentStreakType === 'win'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {data.currentStreak}
              {data.currentStreakType === 'win' ? '連勝' : '連敗'}
            </div>
          )}

          {data.gameMode && <div className="text-xs text-white/50">{data.gameMode}</div>}
        </div>
      ) : (
        <div className="text-white/50 text-sm">メインウィンドウから統計を受信中...</div>
      )}
    </div>
  );
}
