type DuelLogMarkProps = {
  className?: string;
  title?: string;
};

type DuelLogBrandProps = {
  className?: string;
  labelClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
  markClassName?: string;
};

export function DuelLogMark({ className, title = 'Duel Log' }: DuelLogMarkProps) {
  return (
    <svg
      aria-label={title}
      className={className}
      viewBox="0 0 64 64"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="duel-log-mark-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0.9"
            dy="1.1"
            stdDeviation="0.18"
            floodColor="#111827"
            floodOpacity="0.45"
          />
        </filter>
      </defs>
      <rect x="5" y="5" width="54" height="54" rx="16" fill="#243041" />
      <rect x="5" y="5" width="54" height="54" rx="16" fill="none" stroke="#4b5a70" />
      <g fontFamily={'"Liberation Serif", "Times New Roman", serif'} fontSize="43" fontWeight="700">
        <text x="11.828" y="41.831" fill="#e8edf4">
          D
        </text>
        <text x="24.528" y="50.331" fill="#f8fbff" filter="url(#duel-log-mark-shadow)">
          L
        </text>
      </g>
    </svg>
  );
}

export function DuelLogBrand({
  className,
  labelClassName,
  subtitle,
  subtitleClassName,
  markClassName,
}: DuelLogBrandProps) {
  return (
    <div className={className}>
      <DuelLogMark className={markClassName} />
      <div className="min-w-0">
        <div className={labelClassName}>Duel Log</div>
        {subtitle ? <div className={subtitleClassName}>{subtitle}</div> : null}
      </div>
    </div>
  );
}
