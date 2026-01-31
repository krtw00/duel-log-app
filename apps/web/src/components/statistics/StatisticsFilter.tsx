import type { Deck } from '@duel-log/shared';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  decks: Deck[];
  deckId: string | undefined;
  onDeckIdChange: (deckId: string | undefined) => void;
  periodType: 'all' | 'range';
  onPeriodTypeChange: (type: 'all' | 'range') => void;
  rangeStart: number;
  onRangeStartChange: (value: number) => void;
  rangeEnd: number;
  onRangeEndChange: (value: number) => void;
  onReset: () => void;
  totalDuels?: number;
  /** Set of deck IDs used in the current period - if provided, filter dropdown to only show these */
  usedDeckIds?: Set<string>;
};

export function StatisticsFilter({
  decks,
  deckId,
  onDeckIdChange,
  periodType,
  onPeriodTypeChange,
  rangeStart,
  onRangeStartChange,
  rangeEnd,
  onRangeEndChange,
  onReset,
  totalDuels = 30,
  usedDeckIds,
}: Props) {
  const { t } = useTranslation();

  // Filter to my decks, and if usedDeckIds is provided, only show decks that were used
  const myDecks = decks
    .filter((d) => !d.isOpponentDeck)
    .filter((d) => !usedDeckIds || usedDeckIds.has(d.id));
  const sliderMax = Math.max(totalDuels, rangeEnd, 10);

  const handleSliderStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      onRangeStartChange(Math.min(val, rangeEnd));
    },
    [rangeEnd, onRangeStartChange],
  );

  const handleSliderEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      onRangeEndChange(Math.max(val, rangeStart));
    },
    [rangeStart, onRangeEndChange],
  );

  // Calculate slider track fill percentage
  const startPercent = ((rangeStart - 1) / (sliderMax - 1)) * 100;
  const endPercent = ((rangeEnd - 1) / (sliderMax - 1)) * 100;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
          {t('statistics.filter')}
        </h2>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {/* Period Type */}
        <div className="min-w-[120px]">
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-on-surface-muted)' }}
          >
            {t('statistics.period')}
          </label>
          <select
            value={periodType}
            onChange={(e) => onPeriodTypeChange(e.target.value as 'all' | 'range')}
            className="themed-select text-sm"
          >
            <option value="all">{t('statistics.periodAll')}</option>
            <option value="range">{t('statistics.periodRange')}</option>
          </select>
        </div>

        {/* Range Slider + Inputs */}
        {periodType === 'range' && (
          <div className="flex-1 min-w-[200px] max-w-[360px]">
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: 'var(--color-on-surface-muted)' }}
            >
              {t('statistics.rangeStart')} - {t('statistics.rangeEnd')}
            </label>
            {/* Dual Range Slider */}
            <div className="dual-range-slider">
              <div className="dual-range-track">
                <div
                  className="dual-range-fill"
                  style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
                />
              </div>
              <input
                type="range"
                min={1}
                max={sliderMax}
                value={rangeStart}
                onChange={handleSliderStartChange}
                className="dual-range-input"
              />
              <input
                type="range"
                min={1}
                max={sliderMax}
                value={rangeEnd}
                onChange={handleSliderEndChange}
                className="dual-range-input"
              />
            </div>
            {/* Number Inputs */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                min={1}
                max={rangeEnd}
                value={rangeStart}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value));
                  onRangeStartChange(Math.min(val, rangeEnd));
                }}
                className="themed-input text-xs text-center"
                style={{ width: '60px', padding: '2px 4px' }}
              />
              <span className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>
                -
              </span>
              <input
                type="number"
                min={rangeStart}
                value={rangeEnd}
                onChange={(e) => {
                  const val = Math.max(rangeStart, Number(e.target.value));
                  onRangeEndChange(val);
                }}
                className="themed-input text-xs text-center"
                style={{ width: '60px', padding: '2px 4px' }}
              />
            </div>
          </div>
        )}

        {/* Deck Filter */}
        <div className="flex-1 min-w-[150px] max-w-[240px]">
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-on-surface-muted)' }}
          >
            {t('statistics.myDeck')}
          </label>
          <select
            value={deckId ?? ''}
            onChange={(e) => onDeckIdChange(e.target.value || undefined)}
            className="themed-select text-sm"
          >
            <option value="">{t('statistics.allDecks')}</option>
            {myDecks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button type="button" onClick={onReset} className="themed-btn themed-btn-ghost text-sm">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          {t('statistics.reset')}
        </button>
      </div>
    </div>
  );
}
