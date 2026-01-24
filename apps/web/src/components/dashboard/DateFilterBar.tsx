import { useTranslation } from 'react-i18next';

type Props = {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
};

export function DateFilterBar({ year, month, onYearChange, onMonthChange }: Props) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-2">
      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="themed-select"
        style={{ width: 'auto', paddingRight: '32px' }}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => onMonthChange(Number(e.target.value))}
        className="themed-select"
        style={{ width: 'auto', paddingRight: '32px' }}
      >
        {months.map((m) => (
          <option key={m} value={m}>
            {m}
            {t('common.month', '月')}
          </option>
        ))}
      </select>
    </div>
  );
}
