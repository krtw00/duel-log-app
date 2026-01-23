import type { MatchupEntry } from '@duel-log/shared';
import { useMemo } from 'react';

type Props = {
  matchups: MatchupEntry[];
  loading: boolean;
};

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function getColor(winRate: number): string {
  if (winRate >= 0.6) return 'bg-green-100 text-green-800';
  if (winRate >= 0.4) return 'bg-yellow-50 text-gray-700';
  return 'bg-red-100 text-red-800';
}

export function MatchupMatrix({ matchups, loading }: Props) {
  const { myDecks, opponentDecks, matrix } = useMemo(() => {
    const myDeckMap = new Map<string, string>();
    const oppDeckMap = new Map<string, string>();
    const mat = new Map<string, MatchupEntry>();

    for (const m of matchups) {
      myDeckMap.set(m.deckId, m.deckName);
      oppDeckMap.set(m.opponentDeckId, m.opponentDeckName);
      mat.set(`${m.deckId}:${m.opponentDeckId}`, m);
    }

    return {
      myDecks: Array.from(myDeckMap.entries()),
      opponentDecks: Array.from(oppDeckMap.entries()),
      matrix: mat,
    };
  }, [matchups]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse h-40 bg-gray-100 rounded" />
      </div>
    );
  }

  if (matchups.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        データがありません
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">自分 \ 相手</th>
            {opponentDecks.map(([id, name]) => (
              <th
                key={id}
                className="px-3 py-2 text-center font-medium text-gray-600 border-b max-w-[80px] truncate"
                title={name}
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {myDecks.map(([myId, myName]) => (
            <tr key={myId}>
              <td className="px-3 py-2 font-medium text-gray-900 border-r whitespace-nowrap">
                {myName}
              </td>
              {opponentDecks.map(([oppId]) => {
                const entry = matrix.get(`${myId}:${oppId}`);
                if (!entry || entry.wins + entry.losses === 0) {
                  return (
                    <td key={oppId} className="px-3 py-2 text-center text-gray-300">
                      -
                    </td>
                  );
                }
                return (
                  <td key={oppId} className={`px-3 py-2 text-center ${getColor(entry.winRate)}`}>
                    <div className="font-medium">{formatPercent(entry.winRate)}</div>
                    <div className="text-[10px] opacity-70">
                      {entry.wins}-{entry.losses}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
