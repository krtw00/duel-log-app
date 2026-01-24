import { GAME_MODES, type GameMode } from '@duel-log/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateSharedStatistics } from '../../hooks/useSharedStatistics.js';

type Props = {
  open: boolean;
  onClose: () => void;
  defaultYear?: number;
  defaultMonth?: number;
  defaultGameMode?: GameMode;
};

export function ShareStatsDialog({
  open,
  onClose,
  defaultYear,
  defaultMonth,
  defaultGameMode,
}: Props) {
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(defaultYear ?? now.getFullYear());
  const [month, setMonth] = useState(defaultMonth ?? now.getMonth() + 1);
  const [gameMode, setGameMode] = useState<GameMode | ''>(defaultGameMode ?? '');
  const [expiresInDays, setExpiresInDays] = useState<number | null>(30);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createShared = useCreateSharedStatistics();

  // ダイアログを開き直したらリセット
  useEffect(() => {
    if (open) {
      setYear(defaultYear ?? now.getFullYear());
      setMonth(defaultMonth ?? now.getMonth() + 1);
      setGameMode(defaultGameMode ?? '');
      setGeneratedUrl(null);
      setCopied(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultYear, defaultMonth, defaultGameMode]);

  if (!open) return null;

  const handleGenerate = () => {
    const from = new Date(year, month - 1, 1).toISOString();
    const to = new Date(year, month, 0, 23, 59, 59).toISOString();
    const expiresAt =
      expiresInDays !== null
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    createShared.mutate(
      { filters: { from, to, ...(gameMode ? { gameMode } : {}) }, expiresAt },
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

  // 年の選択肢: 現在年から2年前まで
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

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
        className="dialog-content max-w-sm"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={() => {}}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-header">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>
            {t('sharing.title')}
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

        <div className="dialog-body">
          {generatedUrl ? (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                {t('sharing.shareUrl')}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedUrl}
                  className="themed-input flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="themed-btn themed-btn-primary px-3 py-2 text-sm whitespace-nowrap"
                >
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="themed-btn themed-btn-ghost w-full"
              >
                {t('common.close')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 対象月 */}
              <div>
                <label
                  className="block text-base font-medium mb-1"
                  style={{ color: 'var(--color-on-surface-muted)' }}
                >
                  {t('sharing.targetMonth')}
                </label>
                <div className="flex gap-2">
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="themed-select flex-1"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="themed-select flex-1"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {m}
                        {t('sharing.monthSuffix')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ゲームモード */}
              <div>
                <label
                  htmlFor="shareGameMode"
                  className="block text-base font-medium mb-1"
                  style={{ color: 'var(--color-on-surface-muted)' }}
                >
                  {t('duel.gameMode')}
                </label>
                <select
                  id="shareGameMode"
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value as GameMode | '')}
                  className="themed-select w-full"
                >
                  <option value="">{t('sharing.allModes')}</option>
                  {GAME_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {t(`gameMode.${mode}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 有効期限 */}
              <div>
                <label
                  htmlFor="expiresInDays"
                  className="block text-base font-medium mb-1"
                  style={{ color: 'var(--color-on-surface-muted)' }}
                >
                  {t('sharing.expiry')}
                </label>
                <select
                  id="expiresInDays"
                  value={expiresInDays ?? 'unlimited'}
                  onChange={(e) => {
                    const v = e.target.value;
                    setExpiresInDays(v === 'unlimited' ? null : Number(v));
                  }}
                  className="themed-select w-full"
                >
                  <option value={7}>{t('sharing.days', { count: 7 })}</option>
                  <option value={30}>{t('sharing.days', { count: 30 })}</option>
                  <option value={90}>{t('sharing.days', { count: 90 })}</option>
                  <option value={365}>{t('sharing.days', { count: 365 })}</option>
                  <option value="unlimited">{t('sharing.unlimited')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="themed-btn themed-btn-ghost">
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={createShared.isPending}
                  className="themed-btn themed-btn-primary"
                >
                  {createShared.isPending ? t('sharing.generating') : t('sharing.generateLink')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
