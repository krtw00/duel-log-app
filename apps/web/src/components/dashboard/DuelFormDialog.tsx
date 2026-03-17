import {
  type CreateDuel,
  type Deck,
  type Duel,
  type GameMode,
  RESULTS,
  type User,
  createDuelSchema,
} from '@duel-log/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useCreateDeck } from '../../hooks/useDecks.js';
import { useScreenAnalysis } from '../../hooks/useScreenAnalysis.js';
import { api } from '../../lib/api.js';
import { fromDatetimeLocal, getDueledAtForSubmit, toDatetimeLocal } from '../../utils/duel.js';
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
  lastUsedDeckId?: string;
  showPlayMistake?: boolean;
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
  lastUsedDeckId,
  showPlayMistake,
}: Props) {
  const { t } = useTranslation();
  const myDecks = useMemo(
    () =>
      decks
        .filter((d) => !d.isOpponentDeck && d.active)
        .sort((a, b) => {
          const usageA = deckUsage?.get(a.id) ?? 0;
          const usageB = deckUsage?.get(b.id) ?? 0;
          return usageB - usageA;
        }),
    [decks, deckUsage],
  );
  const opponentDecks = useMemo(
    () =>
      decks
        .filter((d) => d.isOpponentDeck && d.active)
        .sort((a, b) => {
          const usageA = opponentDeckUsage?.get(a.id) ?? 0;
          const usageB = opponentDeckUsage?.get(b.id) ?? 0;
          return usageB - usageA;
        }),
    [decks, opponentDeckUsage],
  );
  const defaultDeck =
    (lastUsedDeckId && myDecks.find((d) => d.id === lastUsedDeckId)) || myDecks[0];
  const decksRef = useRef(decks);
  decksRef.current = decks;
  const defaultDeckRef = useRef(defaultDeck);
  defaultDeckRef.current = defaultDeck;
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
  const [dueledAtChanged, setDueledAtChanged] = useState(false);
  const [showDueledAt, setShowDueledAt] = useState(false);

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

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ data: User }>('/me'),
    staleTime: 1000 * 60 * 5,
    enabled: inline,
  });
  const isDebugger = me?.data?.isDebugger ?? false;

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
      const currentDecks = decksRef.current;
      const myDeck = currentDecks.find((d) => d.id === editingDuel.deckId);
      const oppDeck = currentDecks.find((d) => d.id === editingDuel.opponentDeckId);
      setDeckSelection({ id: editingDuel.deckId, name: myDeck?.name ?? '' });
      setOpponentDeckSelection({ id: editingDuel.opponentDeckId, name: oppDeck?.name ?? '' });
      setShowDueledAt(true);
      setDueledAtChanged(false);
    } else {
      const deck = defaultDeckRef.current;
      reset({
        result: 'win',
        gameMode: defaultGameMode ?? 'RANK',
        isFirst: defaultIsFirst,
        wonCoinToss: defaultIsFirst,
        rank: defaultRank,
        dueledAt: new Date().toISOString(),
        deckId: deck?.id ?? '00000000-0000-0000-0000-000000000000',
        opponentDeckId: '00000000-0000-0000-0000-000000000000',
      });
      setDeckSelection(deck ? { id: deck.id, name: deck.name } : { id: '', name: '' });
      setOpponentDeckSelection({ id: '', name: '' });
    }
    // decks/defaultDeck are accessed via refs to avoid resetting user's
    // deck selection on background refetches or post-mutation invalidation.
    // defaultDeck?.id triggers re-init only when the actual default deck changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDuel, defaultGameMode, defaultIsFirst, defaultRank, reset, defaultDeck?.id]);

  const isSupportedGameMode = gameMode !== 'RATE' && gameMode !== 'DC';
  const screenAnalysisEnabled =
    inline &&
    !editingDuel &&
    isSupportedGameMode &&
    (isDebugger || localStorage.getItem('duellog.screenAnalysis.enabled') === 'true');

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

      const dueledAt = getDueledAtForSubmit(editingDuel, data.dueledAt, dueledAtChanged);
      onSubmit({ ...data, deckId: finalDeckId, opponentDeckId: finalOpponentDeckId, dueledAt });

      // Reset form after submission (new registration only)
      if (!editingDuel) {
        setOpponentDeckSelection({ id: '', name: '' });
        setValue('opponentDeckId', '00000000-0000-0000-0000-000000000000');
        setValue('wonCoinToss', defaultIsFirst);
        setValue('isFirst', defaultIsFirst);
        setValue('result', 'win');
        setValue('memo', '');
        setValue('playMistake', null);
        setDueledAtChanged(false);
        setShowDueledAt(false);
      }
    },
    [
      deckSelection,
      opponentDeckSelection,
      createDeck,
      onSubmit,
      t,
      editingDuel,
      setValue,
      defaultIsFirst,
      dueledAtChanged,
    ],
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

  const screenAnalysis = useScreenAnalysis(screenAnalysisEnabled ? handleAutoRegister : undefined, {
    debugLogEnabled: isDebugger,
  });

  useEffect(() => {
    if (!screenAnalysisEnabled && screenAnalysis.status.isCapturing) {
      screenAnalysis.stopCapture();
    }
  }, [screenAnalysisEnabled, screenAnalysis.status.isCapturing, screenAnalysis.stopCapture]);

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
                name="wonCoinToss"
                checked={wonCoinToss === true}
                onChange={() => setValue('wonCoinToss', true)}
                className="accent-[var(--color-warning)]"
              />
              <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
                {t('duel.coinTossWin')}
              </span>
            </label>
            <label className="radio-option cursor-pointer">
              <input
                type="radio"
                name="wonCoinToss"
                checked={wonCoinToss === false}
                onChange={() => setValue('wonCoinToss', false)}
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
                name="isFirst"
                checked={isFirst === true}
                onChange={() => setValue('isFirst', true)}
                className="accent-[#00d9ff]"
              />
              <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
                {t('duel.first')}
              </span>
            </label>
            <label className="radio-option cursor-pointer">
              <input
                type="radio"
                name="isFirst"
                checked={isFirst === false}
                onChange={() => setValue('isFirst', false)}
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
                  name="result"
                  checked={result === r}
                  onChange={() => setValue('result', r)}
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
            type="text"
            inputMode="decimal"
            {...register('rateValue', {
              setValueAs: (v: string) => {
                if (v === '' || v == null) return null;
                const n = Number(v);
                return Number.isNaN(n) ? null : n;
              },
            })}
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
            type="text"
            inputMode="numeric"
            {...register('dcValue', {
              setValueAs: (v: string) => {
                if (v === '' || v == null) return null;
                const n = Number(v);
                return Number.isNaN(n) ? null : n;
              },
            })}
            className="themed-input"
          />
        </div>
      )}

      {/* Row 5: Duel Date/Time (editing only) */}
      {editingDuel && (
        <div>
          {!showDueledAt ? (
            <button
              type="button"
              className="text-sm flex items-center gap-1"
              style={{ color: 'var(--color-on-surface-muted)' }}
              onClick={() => {
                setShowDueledAt(true);
                setValue('dueledAt', new Date().toISOString());
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {t('duel.dueledAt')}
            </button>
          ) : (
            <div>
              <label
                htmlFor="dueledAt"
                className="block text-base font-medium mb-1"
                style={{ color: 'var(--color-on-surface-muted)' }}
              >
                {t('duel.dueledAt')}
              </label>
              <input
                id="dueledAt"
                type="datetime-local"
                value={toDatetimeLocal(watch('dueledAt'))}
                onChange={(e) => {
                  if (e.target.value) {
                    setValue('dueledAt', fromDatetimeLocal(e.target.value));
                    setDueledAtChanged(true);
                  }
                }}
                className="themed-input"
              />
            </div>
          )}
        </div>
      )}

      {/* Row 6: Play Mistake (optional) */}
      {showPlayMistake && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={watch('playMistake') === true}
            onChange={(e) => setValue('playMistake', e.target.checked || null)}
            className="accent-[var(--color-error)]"
          />
          <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
            {t('duel.playMistake')}
          </span>
        </label>
      )}

      {/* Row 7: Memo */}
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
