import type { GameMode } from '@duel-log/shared';
import { useState } from 'react';
import { useMatchups, useValueSequence, useWinRates } from '../../hooks/useStatistics.js';
import { GameModeTabBar } from '../dashboard/GameModeTabBar.js';
import { DeckDistributionChart } from './DeckDistributionChart.js';
import { MatchupMatrix } from './MatchupMatrix.js';
import { ValueSequenceChart } from './ValueSequenceChart.js';
import { WinRateTable } from './WinRateTable.js';

export function StatisticsView() {
  const [gameMode, setGameMode] = useState<GameMode | undefined>(undefined);

  const filter = { gameMode };
  const valueFilter = gameMode && gameMode !== 'EVENT' ? { gameMode } : undefined;

  const { data: winRatesData, isLoading: winRatesLoading } = useWinRates(filter);
  const { data: matchupsData, isLoading: matchupsLoading } = useMatchups(filter);
  const { data: valueData, isLoading: valueLoading } = useValueSequence(
    valueFilter as { gameMode: 'RANK' | 'RATE' | 'DC' } | undefined,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">統計</h1>

      {/* ゲームモードフィルタ */}
      <GameModeTabBar value={gameMode} onChange={setGameMode} />

      {/* デッキ別勝率 */}
      <section>
        <h2 className="text-lg font-semibold mb-3">デッキ別勝率</h2>
        <WinRateTable winRates={winRatesData?.data ?? []} loading={winRatesLoading} />
      </section>

      {/* デッキ使用分布 */}
      <section>
        <DeckDistributionChart winRates={winRatesData?.data ?? []} loading={winRatesLoading} />
      </section>

      {/* 相性表 */}
      <section>
        <h2 className="text-lg font-semibold mb-3">相性表</h2>
        <MatchupMatrix matchups={matchupsData?.data ?? []} loading={matchupsLoading} />
      </section>

      {/* ランク/レート/DC推移 */}
      {valueFilter && (
        <section>
          <ValueSequenceChart
            data={valueData?.data ?? []}
            gameMode={valueFilter.gameMode}
            loading={valueLoading}
          />
        </section>
      )}
    </div>
  );
}
