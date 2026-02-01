import { useTranslation } from 'react-i18next';
import type { useScreenAnalysis } from '../../hooks/useScreenAnalysis.js';
import {
  COIN_BAR_ROI,
  COIN_BUTTONS_ROI,
  RESULT_TEXT_ROI,
  SCAN_FPS,
} from '../../utils/screenAnalysis/config.js';

type Props = {
  analysis: ReturnType<typeof useScreenAnalysis>;
  canAutoRegister: boolean;
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

export function ScreenAnalysisPanel({ analysis, canAutoRegister }: Props) {
  const { t } = useTranslation();
  const {
    status,
    startCapture,
    stopCapture,
    autoRegister,
    setAutoRegister,
    debugLoggingEnabled,
    setDebugLoggingEnabled,
    debugSessionId,
    lastFrame,
  } = analysis;

  const isCoinActive = status.state === 'coinDetecting' || status.state === 'coinDetected';
  const isResultActive = status.state === 'resultDetecting' || status.state === 'resultDetected';
  const previewWidth = 160;
  const previewHeight = 90;

  const roiItems = [
    { label: t('screenAnalysis.roi.coinBar'), roi: COIN_BAR_ROI, color: 'var(--color-warning)' },
    {
      label: t('screenAnalysis.roi.coinButtons'),
      roi: COIN_BUTTONS_ROI,
      color: 'var(--color-secondary)',
    },
    {
      label: t('screenAnalysis.roi.resultText'),
      roi: RESULT_TEXT_ROI,
      color: 'var(--color-success)',
    },
  ];

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
        {canAutoRegister && (
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
        )}

        {canAutoRegister && (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={debugLoggingEnabled}
              onChange={(e) => setDebugLoggingEnabled(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
              {t('screenAnalysis.logToFile')}
            </span>
          </label>
        )}

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

      {canAutoRegister && (
        <details className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
          <summary className="cursor-pointer">{t('screenAnalysis.debug')}</summary>
          <div className="mt-2 space-y-2">
            <div className="flex items-start gap-3 flex-wrap">
              <svg
                width={previewWidth}
                height={previewHeight}
                viewBox={`0 0 ${previewWidth} ${previewHeight}`}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                }}
              >
                {roiItems.map((item) => (
                  <rect
                    key={item.label}
                    x={item.roi.left * previewWidth}
                    y={item.roi.top * previewHeight}
                    width={item.roi.width * previewWidth}
                    height={item.roi.height * previewHeight}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={1}
                  />
                ))}
              </svg>
              <div className="space-y-1">
                <div className="text-xs">{t('screenAnalysis.roi.title')}</div>
                {roiItems.map((item) => (
                  <div key={item.label} className="text-xs">
                    {item.label}:{' '}
                    {`${(item.roi.left * 100).toFixed(1)}%, ${(item.roi.top * 100).toFixed(1)}%, ${(item.roi.width * 100).toFixed(1)}%, ${(item.roi.height * 100).toFixed(1)}%`}
                  </div>
                ))}
                <div className="text-xs">
                  {t('screenAnalysis.scanFps')}: {SCAN_FPS}fps
                </div>
                {debugSessionId && (
                  <div className="text-xs">
                    {t('screenAnalysis.session')}: {debugSessionId}
                  </div>
                )}
              </div>
            </div>

            {lastFrame && (
              <div className="text-xs">
                {t('screenAnalysis.lastFrame')}: coin {String(lastFrame.coin)} (
                {lastFrame.coinConfidence.toFixed(2)}) / result {String(lastFrame.result)} (
                {lastFrame.resultConfidence.toFixed(2)})
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
