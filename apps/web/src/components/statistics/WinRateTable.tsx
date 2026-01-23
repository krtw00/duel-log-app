import type { DeckWinRate } from '@duel-log/shared';

type Props = {
  winRates: DeckWinRate[];
  loading: boolean;
};

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function WinRateTable({ winRates, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse space-y-3">
          {['s1', 's2', 's3'].map((id) => (
            <div key={id} className="h-8 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (winRates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        データがありません
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">デッキ</th>
            <th className="px-4 py-3 text-center font-medium text-gray-600">勝率</th>
            <th className="px-4 py-3 text-center font-medium text-gray-600">勝</th>
            <th className="px-4 py-3 text-center font-medium text-gray-600">敗</th>
            <th className="px-4 py-3 text-center font-medium text-gray-600">試合数</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {winRates.map((rate) => (
            <tr key={rate.deckId}>
              <td className="px-4 py-3 font-medium text-gray-900">{rate.deckName}</td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`font-medium ${rate.winRate >= 0.5 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatPercent(rate.winRate)}
                </span>
              </td>
              <td className="px-4 py-3 text-center text-green-600">{rate.wins}</td>
              <td className="px-4 py-3 text-center text-red-600">{rate.losses}</td>
              <td className="px-4 py-3 text-center text-gray-600">{rate.totalDuels}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
