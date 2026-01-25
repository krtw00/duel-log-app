import {
  type CreateDuel,
  type Deck,
  type Duel,
  type GameMode,
  RESULTS,
  createDuelSchema,
} from '@duel-log/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useCreateDeck } from '../../hooks/useDecks.js';
import { useScreenAnalysis } from '../../hooks/useScreenAnalysis.js';
import { RANK_DEFINITIONS, getRankLabel } from '../../utils/ranks.js';
import { DeckCombobox } from './DeckCombobox.js';
import { ScreenAnalysisPanel } from './ScreenAnalysisPanel.js';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDuel) => void;
  editingDuel?: Duel | null;
  decks: Deck[];
  loading?: boolean;
  defaultGameMode?: GameMode;
  defaultIsFirst?: boolean;
  defaultRank?: number;
  inline?: boolean;
  deckUsage?: Map<string, number>;
  opponentDeckUsage?: Map<string, number>;
};

export function DuelFormDialog({
  open,
  onClose,
  onSubmit,
  editingDuel,
  decks,
  loading,
  defaultGameMode,
  defaultIsFirst = true,
  defaultRank,
  inline,
  deckUsage,
  opponentDeckUsage,
}: Props) {
  const { t } = useTranslation();
  const myDecks = decks
    .filter((d) => !d.isOpponentDeck && d.active)
    .sort((a, b) => {
      const usageA = deckUsage?.get(a.id) ?? 0;
      const usageB = deckUsage?.get(b.id) ?? 0;
      return usageB - usageA;
    });
  const opponentDecks = decks
    .filter((d) => d.isOpponentDeck && d.active)
    .sort((a, b) => {
      const usageA = opponentDeckUsage?.get(a.id) ?? 0;
      const usageB = opponentDeckUsage?.get(b.id) ?? 0;
      return usageB - usageA;
    });
  const createDeck = useCreateDeck();

  // Deck combobox state: track both ID (for existing) and name (for new)
  const [deckSelection, setDeckSelection] = useState<{ id: string; name: string }>({
    id: '',
    name: '',
  });
  const [opponentDeckSelection, setOpponentDeckSelection] = useState<{ id: string; name: string }>({
    id: '',
    name: '',
  });
  const [deckError, setDeckError] = useState('');
  const [opponentDeckError, setOpponentDeckError] = useState('');

  const { register, handleSubmit, reset, watch, setValue } = useForm<CreateDuel>({
    resolver: zodResolver(createDuelSchema),
    defaultValues: {
      result: 'win',
      gameMode: defaultGameMode ?? 'RANK',
      isFirst: defaultIsFirst,
      wonCoinToss: defaultIsFirst,
      rank: defaultRank,
      dueledAt: new Date().toISOString(),
      deckId: '00000000-0000-0000-0000-000000000000',
      opponentDeckId: '00000000-0000-0000-0000-000000000000',
    },
  });

  const gameMode = watch('gameMode');
  const wonCoinToss = watch('wonCoinToss');
  const isFirst = watch('isFirst');
  const result = watch('result');

  // Auto-set first/second based on coin toss result (new duels only)
  // 後攻デフォルト時はコイン結果に関わらず後攻を維持
  useEffect(() => {
    if (!editingDuel && wonCoinToss !== undefined && defaultIsFirst) {
      setValue('isFirst', wonCoinToss);
    }
  }, [wonCoinToss, editingDuel, defaultIsFirst, setValue]);

  useEffect(() => {
    if (editingDuel) {
      reset({
        deckId: editingDuel.deckId,
        opponentDeckId: editingDuel.opponentDeckId,
        result: editingDuel.result,
        gameMode: editingDuel.gameMode,
        isFirst: editingDuel.isFirst,
        wonCoinToss: editingDuel.wonCoinToss,
        rank: editingDuel.rank,
        rateValue: editingDuel.rateValue,
        dcValue: editingDuel.dcValue,
        memo: editingDuel.memo,
        dueledAt: editingDuel.dueledAt,
      });
      const myDeck = decks.find((d) => d.id === editingDuel.deckId);
      const oppDeck = decks.find((d) => d.id === editingDuel.opponentDeckId);
      setDeckSelection({ id: editingDuel.deckId, name: myDeck?.name ?? '' });
      setOpponentDeckSelection({ id: editingDuel.opponentDeckId, name: oppDeck?.name ?? '' });
    } else {
      reset({
        result: 'win',
        gameMode: defaultGameMode ?? 'RANK',
        isFirst: defaultIsFirst,
        wonCoinToss: defaultIsFirst,
        rank: defaultRank,
        dueledAt: new Date().toISOString(),
        deckId: '00000000-0000-0000-0000-000000000000',
        opponentDeckId: '00000000-0000-0000-0000-000000000000',
      });
      setDeckSelection({ id: '', name: '' });
      setOpponentDeckSelection({ id: '', name: '' });
    }
  }, [editingDuel, defaultGameMode, defaultIsFirst, defaultRank, reset, decks]);

  const screenAnalysisEnabled =
    inline && !editingDuel && localStorage.getItem('duellog.screenAnalysis.enabled') === 'true';

  const handleFormSubmit = useCallback(
    async (data: CreateDuel) => {
      let finalDeckId = deckSelection.id;
      let finalOpponentDeckId = opponentDeckSelection.id;

      // Validate deck selections
      if (!finalDeckId && !deckSelection.name) {
        setDeckError(t('validation.required'));
        return;
      }
      if (!finalOpponentDeckId && !opponentDeckSelection.name) {
        setOpponentDeckError(t('validation.required'));
        return;
      }
      setDeckError('');
      setOpponentDeckError('');

      // Create new decks if needed
      if (!finalDeckId && deckSelection.name) {
        const result = await createDeck.mutateAsync({
          name: deckSelection.name,
          isOpponentDeck: false,
        });
        finalDeckId = result.data.id;
        setDeckSelection({ id: finalDeckId, name: deckSelection.name });
      }
      if (!finalOpponentDeckId && opponentDeckSelection.name) {
        const result = await createDeck.mutateAsync({
          name: opponentDeckSelection.name,
          isOpponentDeck: true,
        });
        finalOpponentDeckId = result.data.id;
        setOpponentDeckSelection({ id: finalOpponentDeckId, name: opponentDeckSelection.name });
      }

      onSubmit({ ...data, deckId: finalDeckId, opponentDeckId: finalOpponentDeckId });
    },
    [deckSelection, opponentDeckSelection, createDeck, onSubmit, t],
  );

  const handleAutoRegister = useCallback(
    (data: { coin: 'won' | 'lost' | null; isFirst: boolean; result: 'win' | 'loss' | null }) => {
      if (data.coin !== null) setValue('wonCoinToss', data.coin === 'won');
      if (data.result !== null) setValue('result', data.result);
      setValue('isFirst', data.isFirst);
      handleSubmit(handleFormSubmit)();
    },
    [setValue, handleSubmit, handleFormSubmit],
  );

  const screenAnalysis = useScreenAnalysis(screenAnalysisEnabled ? handleAutoRegister : undefined);

  if (!open && !inline) return null;

  const formContent = (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Row 1: Decks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="deckId"
            className="block text-base font-medium mb-1"
            style={{ color: 'var(--color-on-surface-muted)' }}
          >
            {t('duel.deck')}
          </label>
          <DeckCombobox
            id="deckId"
            decks={myDecks}
            value={deckSelection.id}
            onChange={(id, name) => {
              setDeckSelection({ id, name });
              if (id) setValue('deckId', id);
              setDeckError('');
            }}
            error={deckError}
          />
        </div>
        <div>
          <label
            htmlFor="opponentDeckId"
            className="block text-base font-medium mb-1"
            style={{ color: 'var(--color-on-surface-muted)' }}
          >
            {t('duel.opponentDeck')}
          </label>
          <DeckCombobox
            id="opponentDeckId"
            decks={opponentDecks}
            value={opponentDeckSelection.id}
            onChange={(id, name) => {
              setOpponentDeckSelection({ id, name });
              if (id) setValue('opponentDeckId', id);
              setOpponentDeckError('');
            }}
            error={opponentDeckError}
          />
        </div>
      </div>

      {/* Row 2: Coin / First-Second / Result (radio groups) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Coin Toss */}
        <div className="radio-group-wrapper">
          <div className="radio-label">{t('duel.coinToss')}</div>
          <div className="flex gap-2">
            <label className="radio-option cursor-pointer">
              <input
                type="radio"
                value="true"
                checked={wonCoinToss === true}
                {...register('wonCoinToss', { setValueAs: (v: string) => v === 'true' })}
                className="accent-[var(--color-warning)]"
              />
              <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
                {t('duel.coinTossWin')}
              </span>
            </label>
            <label className="radio-option cursor-pointer">
              <input
                type="radio"
                value="false"
                checked={wonCoinToss === false}
                {...register('wonCoinToss', { setValueAs: (v: string) => v === 'true' })}
                className="accent-[var(--color-on-surface-muted)]"
              />
              <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
                {t('duel.coinTossLoss')}
              </span>
            </label>
          </div>
        </div>

        {/* First/Second */}
        <div className="radio-group-wrapper">
          <div className="radio-label">{t('duel.firstSecond')}</div>
          <div className="flex gap-2">
            <label className="radio-option cursor-pointer">
              <input
                type="radio"
                value="true"
                checked={isFirst === true}
                {...register('isFirst', { setValueAs: (v: string) => v === 'true' })}
                className="accent-[#00d9ff]"
              />
              <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
                {t('duel.first')}
              </span>
            </label>
            <label className="radio-option cursor-pointer">
              <input
                type="radio"
                value="false"
                checked={isFirst === false}
                {...register('isFirst', { setValueAs: (v: string) => v === 'true' })}
                className="accent-[var(--color-secondary)]"
              />
              <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
                {t('duel.second')}
              </span>
            </label>
          </div>
        </div>

        {/* Result */}
        <div className="radio-group-wrapper">
          <div className="radio-label">{t('duel.result')}</div>
          <div className="flex gap-2">
            {RESULTS.map((r) => (
              <label key={r} className="radio-option cursor-pointer">
                <input
                  type="radio"
                  value={r}
                  checked={result === r}
                  {...register('result')}
                  className={
                    r === 'win' ? 'accent-[var(--color-success)]' : 'accent-[var(--color-error)]'
                  }
                />
                <span
                  className="text-sm"
                  style={{ color: r === 'win' ? 'var(--color-success)' : 'var(--color-error)' }}
                >
                  {r === 'win' ? t('duel.win') : t('duel.loss')}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Conditional value fields */}
      {gameMode === 'RANK' && (
        <div>
          <label
            htmlFor="rank"
            className="block text-base font-medium mb-1"
            style={{ color: 'var(--color-on-surface-muted)' }}
          >
            {t('duel.rank')}
          </label>
          <select
            id="rank"
            {...register('rank', { valueAsNumber: true })}
            className="themed-select"
          >
            <option value="">---</option>
            {RANK_DEFINITIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {getRankLabel(r.value, t)}
              </option>
            ))}
          </select>
        </div>
      )}
      {gameMode === 'RATE' && (
        <div>
          <label
            htmlFor="rateValue"
            className="block text-base font-medium mb-1"
            style={{ color: 'var(--color-on-surface-muted)' }}
          >
            {t('duel.rateValue')}
          </label>
          <input
            id="rateValue"
            type="number"
            step="0.1"
            {...register('rateValue', { valueAsNumber: true })}
            className="themed-input"
          />
        </div>
      )}
      {gameMode === 'DC' && (
        <div>
          <label
            htmlFor="dcValue"
            className="block text-base font-medium mb-1"
            style={{ color: 'var(--color-on-surface-muted)' }}
          >
            {t('duel.dcValue')}
          </label>
          <input
            id="dcValue"
            type="number"
            {...register('dcValue', { valueAsNumber: true })}
            className="themed-input"
          />
        </div>
      )}

      {/* Row 5: Memo */}
      <div>
        <label
          htmlFor="memo"
          className="block text-base font-medium mb-1"
          style={{ color: 'var(--color-on-surface-muted)' }}
        >
          {t('duel.memo')}
        </label>
        <textarea
          id="memo"
          {...register('memo')}
          rows={2}
          className="themed-input"
          style={{ resize: 'vertical' }}
        />
      </div>

      {/* Row 6: Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        {(!inline || editingDuel) && (
          <button type="button" onClick={onClose} className="themed-btn themed-btn-ghost">
            {t('common.cancel')}
          </button>
        )}
        <button type="submit" disabled={loading} className="themed-btn themed-btn-primary">
          {loading ? t('common.saving') : editingDuel ? t('common.save') : t('common.create')}
        </button>
      </div>
    </form>
  );

  if (inline) {
    return (
      <div className="glass-card p-4 space-y-4">
        {screenAnalysisEnabled && <ScreenAnalysisPanel analysis={screenAnalysis} />}
        {formContent}
      </div>
    );
  }

  return (
    <div
      className="dialog-overlay"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="button"
      tabIndex={0}
      aria-label="Close dialog"
    >
      <div
        className="dialog-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={() => {}}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-header">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>
            {editingDuel ? t('duel.editTitle') : t('duel.addTitle')}
          </h2>
          <button type="button" onClick={onClose} className="themed-btn themed-btn-ghost p-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="dialog-body">{formContent}</div>
      </div>
    </div>
  );
}
