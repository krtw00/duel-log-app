import { useTranslation } from 'react-i18next';
import type { useScreenAnalysis } from '../../hooks/useScreenAnalysis.js';

type Props = {
  analysis: ReturnType<typeof useScreenAnalysis>;
};

function StateChip({ label, active, color }: { label: string; active: boolean; color: string }) {
  return (
    <span
      className="text-sm px-2 py-0.5 rounded"
      style={{
        backgroundColor: active ? `${color}20` : 'transparent',
        color: active ? color : 'var(--color-on-surface-muted)',
        border: `1px solid ${active ? color : 'var(--color-border)'}`,
      }}
    >
      {label}
    </span>
  );
}

export function ScreenAnalysisPanel({ analysis }: Props) {
  const { t } = useTranslation();
  const { status, startCapture, stopCapture, autoRegister, setAutoRegister } = analysis;

  const isCoinActive = status.state === 'coinDetecting' || status.state === 'coinDetected';
  const isResultActive = status.state === 'resultDetecting' || status.state === 'resultDetected';

  return (
    <div
      className="p-3 rounded-lg space-y-3"
      style={{ border: '1px solid var(--color-border)', background: 'rgba(128,128,128,0.03)' }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {/* Start/Stop Button */}
        <button
          type="button"
          onClick={status.isCapturing ? stopCapture : startCapture}
          className={`themed-btn text-sm ${status.isCapturing ? 'themed-btn-outlined' : 'themed-btn-primary'}`}
        >
          {status.isCapturing ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
              {t('screenAnalysis.stop')}
            </>
          ) : (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {t('screenAnalysis.start')}
            </>
          )}
        </button>

        {/* Auto Register Toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRegister}
            onChange={(e) => setAutoRegister(e.target.checked)}
            className="accent-[var(--color-primary)]"
          />
          <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
            {t('screenAnalysis.autoRegister')}
          </span>
        </label>

        {/* Status Badge */}
        <span
          className="text-sm px-2 py-0.5 rounded"
          style={{
            backgroundColor: status.isCapturing ? 'rgba(0,230,118,0.15)' : 'rgba(128,128,128,0.1)',
            color: status.isCapturing ? 'var(--color-success)' : 'var(--color-on-surface-muted)',
          }}
        >
          {status.isCapturing
            ? status.state === 'idle'
              ? t('screenAnalysis.status.idle')
              : status.state === 'resultDetected'
                ? t('screenAnalysis.status.detected')
                : t('screenAnalysis.status.detecting')
            : t('screenAnalysis.status.idle')}
        </span>
      </div>

      {/* Detection state chips */}
      {status.isCapturing && (
        <div className="flex items-center gap-2 flex-wrap">
          <StateChip
            label={`${t('screenAnalysis.coinDetected')}: ${status.coinResult === 'won' ? '✓' : status.coinResult === 'lost' ? '✗' : '-'}`}
            active={isCoinActive}
            color={
              status.coinResult === 'won' ? 'var(--color-warning)' : 'var(--color-on-surface-muted)'
            }
          />
          <StateChip
            label={`${t('screenAnalysis.resultDetected')}: ${status.detectionResult === 'win' ? '✓' : status.detectionResult === 'loss' ? '✗' : '-'}`}
            active={isResultActive}
            color={
              status.detectionResult === 'win'
                ? 'var(--color-success)'
                : status.detectionResult === 'loss'
                  ? 'var(--color-error)'
                  : 'var(--color-on-surface-muted)'
            }
          />
          {status.state === 'cooldown' && (
            <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
              {t('screenAnalysis.waiting')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
