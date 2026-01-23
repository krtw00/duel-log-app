import { GAME_MODES, type GameMode } from '@duel-log/shared';
import { useState } from 'react';
import { useCreateSharedStatistics } from '../../hooks/useSharedStatistics.js';

const GAME_MODE_LABELS: Record<GameMode, string> = {
  RANK: 'ランク',
  RATE: 'レート',
  EVENT: 'イベント',
  DC: 'DC',
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ShareStatsDialog({ open, onClose }: Props) {
  const [gameMode, setGameMode] = useState<GameMode | ''>('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createShared = useCreateSharedStatistics();

  if (!open) return null;

  const handleGenerate = () => {
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const filters = gameMode ? { gameMode } : {};

    createShared.mutate(
      { filters, expiresAt },
      {
        onSuccess: (result) => {
          const url = `${window.location.origin}/shared/${result.data.token}`;
          setGeneratedUrl(url);
        },
      },
    );
  };

  const handleCopy = async () => {
    if (generatedUrl) {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={handleBackdropKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold mb-4">統計を共有</h2>

        {generatedUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">共有URLが生成されました：</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={generatedUrl}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {copied ? 'コピー済み' : 'コピー'}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              閉じる
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="shareGameMode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ゲームモード（任意）
              </label>
              <select
                id="shareGameMode"
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value as GameMode | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">全て</option>
                {GAME_MODES.map((m) => (
                  <option key={m} value={m}>
                    {GAME_MODE_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="expiresInDays"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                有効期限
              </label>
              <select
                id="expiresInDays"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value={7}>7日</option>
                <option value={30}>30日</option>
                <option value={90}>90日</option>
                <option value={365}>1年</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={createShared.isPending}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createShared.isPending ? '生成中...' : 'URL生成'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
