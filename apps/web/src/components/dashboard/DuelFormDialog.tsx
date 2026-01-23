import {
  type CreateDuel,
  type Deck,
  type Duel,
  GAME_MODES,
  type GameMode,
  RESULTS,
  createDuelSchema,
} from '@duel-log/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const GAME_MODE_LABELS: Record<GameMode, string> = {
  RANK: 'ランク',
  RATE: 'レート',
  EVENT: 'イベント',
  DC: 'DC',
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDuel) => void;
  editingDuel?: Duel | null;
  decks: Deck[];
  loading?: boolean;
  defaultGameMode?: GameMode;
};

export function DuelFormDialog({
  open,
  onClose,
  onSubmit,
  editingDuel,
  decks,
  loading,
  defaultGameMode,
}: Props) {
  const myDecks = decks.filter((d) => !d.isOpponentDeck && d.active);
  const opponentDecks = decks.filter((d) => d.isOpponentDeck && d.active);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateDuel>({
    resolver: zodResolver(createDuelSchema),
    defaultValues: {
      result: 'win',
      gameMode: defaultGameMode ?? 'RANK',
      isFirst: true,
      wonCoinToss: true,
      dueledAt: new Date().toISOString(),
    },
  });

  const gameMode = watch('gameMode');

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
    } else {
      reset({
        result: 'win',
        gameMode: defaultGameMode ?? 'RANK',
        isFirst: true,
        wonCoinToss: true,
        dueledAt: new Date().toISOString(),
      });
    }
  }, [editingDuel, defaultGameMode, reset]);

  if (!open) return null;

  const handleFormSubmit = (data: CreateDuel) => {
    onSubmit(data);
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
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold mb-4">
          {editingDuel ? '対戦記録を編集' : '対戦記録を追加'}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* 結果 */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-1">結果</legend>
            <div className="flex gap-2">
              {RESULTS.map((r) => (
                <label key={r} className="flex items-center gap-1">
                  <input type="radio" value={r} {...register('result')} />
                  <span className={r === 'win' ? 'text-green-600' : 'text-red-600'}>
                    {r === 'win' ? '勝利' : '敗北'}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* ゲームモード */}
          <div>
            <label htmlFor="gameMode" className="block text-sm font-medium text-gray-700 mb-1">
              ゲームモード
            </label>
            <select
              id="gameMode"
              {...register('gameMode')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {GAME_MODES.map((m) => (
                <option key={m} value={m}>
                  {GAME_MODE_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          {/* デッキ */}
          <div>
            <label htmlFor="deckId" className="block text-sm font-medium text-gray-700 mb-1">
              自分のデッキ
            </label>
            <select
              id="deckId"
              {...register('deckId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">選択してください</option>
              {myDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.deckId && <p className="text-red-500 text-xs mt-1">{errors.deckId.message}</p>}
          </div>

          {/* 相手デッキ */}
          <div>
            <label
              htmlFor="opponentDeckId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              相手のデッキ
            </label>
            <select
              id="opponentDeckId"
              {...register('opponentDeckId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">選択してください</option>
              {opponentDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.opponentDeckId && (
              <p className="text-red-500 text-xs mt-1">{errors.opponentDeckId.message}</p>
            )}
          </div>

          {/* 先攻/後攻 */}
          <div className="flex gap-4">
            <label className="flex items-center gap-1">
              <input type="checkbox" {...register('isFirst')} />
              <span className="text-sm">先攻</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" {...register('wonCoinToss')} />
              <span className="text-sm">じゃんけん勝ち</span>
            </label>
          </div>

          {/* ランク値 (RANK モードのみ) */}
          {gameMode === 'RANK' && (
            <div>
              <label htmlFor="rank" className="block text-sm font-medium text-gray-700 mb-1">
                ランク
              </label>
              <input
                id="rank"
                type="number"
                {...register('rank', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          {/* レート値 (RATE モードのみ) */}
          {gameMode === 'RATE' && (
            <div>
              <label htmlFor="rateValue" className="block text-sm font-medium text-gray-700 mb-1">
                レート
              </label>
              <input
                id="rateValue"
                type="number"
                step="0.1"
                {...register('rateValue', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          {/* DC値 (DC モードのみ) */}
          {gameMode === 'DC' && (
            <div>
              <label htmlFor="dcValue" className="block text-sm font-medium text-gray-700 mb-1">
                DC値
              </label>
              <input
                id="dcValue"
                type="number"
                {...register('dcValue', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          {/* メモ */}
          <div>
            <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
              メモ
            </label>
            <textarea
              id="memo"
              {...register('memo')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="任意のメモ"
            />
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : editingDuel ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
