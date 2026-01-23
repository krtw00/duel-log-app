import type { Deck, Duel } from '@duel-log/shared';
import { useState } from 'react';

type Props = {
  duels: Duel[];
  decks: Deck[];
  loading: boolean;
  onEdit: (duel: Duel) => void;
  onDelete: (id: string) => void;
};

function getDeckName(decks: Deck[], deckId: string): string {
  return decks.find((d) => d.id === deckId)?.name ?? '不明';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DuelTable({ duels, decks, loading, onEdit, onDelete }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="animate-pulse p-4 space-y-3">
          {['s1', 's2', 's3', 's4', 's5'].map((id) => (
            <div key={id} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (duels.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        対戦記録がありません。右上のボタンから記録を追加してください。
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">日時</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">結果</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">デッキ</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">相手デッキ</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">先後</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">モード</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {duels.map((duel) => (
              <tr key={duel.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {formatDate(duel.dueledAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      duel.result === 'win'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {duel.result === 'win' ? '勝利' : '敗北'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{getDeckName(decks, duel.deckId)}</td>
                <td className="px-4 py-3 text-gray-700">
                  {getDeckName(decks, duel.opponentDeckId)}
                </td>
                <td className="px-4 py-3 text-gray-700">{duel.isFirst ? '先攻' : '後攻'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{duel.gameMode}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 text-xs mr-2"
                    onClick={() => onEdit(duel)}
                  >
                    編集
                  </button>
                  {confirmDeleteId === duel.id ? (
                    <>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800 text-xs mr-1"
                        onClick={() => {
                          onDelete(duel.id);
                          setConfirmDeleteId(null);
                        }}
                      >
                        確定
                      </button>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 text-xs"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800 text-xs"
                      onClick={() => setConfirmDeleteId(duel.id)}
                    >
                      削除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
