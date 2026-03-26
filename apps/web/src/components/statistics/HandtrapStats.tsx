import { DEFAULT_HANDTRAP_CARDS, type HandtrapStatsEntry } from '@duel-log/shared';
import { useTranslation } from 'react-i18next';
import {
  type UserHandtrapCard,
  getHandtrapName,
  getHandtrapNameFromId,
} from '../../utils/handtraps.js';

type Props = {
  stats: HandtrapStatsEntry[];
  customCards: UserHandtrapCard[];
  loading?: boolean;
};

export function HandtrapStats({ stats, customCards, loading }: Props) {
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {['a', 'b', 'c', 'd'].map((key) => (
          <div
            key={key}
            className="h-10 rounded"
            style={{ background: 'var(--color-surface-variant)' }}
          />
        ))}
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
        {t('statistics.handtrapNoData')}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="themed-table">
        <thead>
          <tr>
            <th>{t('statistics.handtrapCard')}</th>
            <th className="text-center">{t('statistics.handtrapHitCount')}</th>
            <th className="text-center">{t('statistics.wins')}</th>
            <th className="text-center">{t('statistics.losses')}</th>
            <th className="text-center">{t('statistics.handtrapWinRate')}</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((entry) => {
            const defaultCard = DEFAULT_HANDTRAP_CARDS.find((card) => card.id === entry.handtrapId);
            const cardName = defaultCard
              ? getHandtrapName(defaultCard, i18n.language)
              : getHandtrapNameFromId(entry.handtrapId, i18n.language, customCards);

            return (
              <tr key={entry.handtrapId}>
                <td className="font-medium" style={{ color: 'var(--color-on-surface)' }}>
                  {cardName}
                </td>
                <td className="text-center" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {entry.totalHit}
                </td>
                <td className="text-center" style={{ color: 'var(--color-success)' }}>
                  {entry.wins}
                </td>
                <td className="text-center" style={{ color: 'var(--color-error)' }}>
                  {entry.losses}
                </td>
                <td className="text-center">
                  <span className="chip chip-outlined-info">
                    {(entry.winRate * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
