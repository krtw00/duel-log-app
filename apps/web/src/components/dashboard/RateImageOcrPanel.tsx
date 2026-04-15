import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  recognizeDcValueFromFile,
  recognizeRateValueFromFile,
  type RateOcrResult,
} from '../../utils/rateImageOcr.js';

type Props = {
  mode: 'RATE' | 'DC';
  onValueDetected: (value: number) => void;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function RateImageOcrPanel({ mode, onValueDetected }: Props) {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [result, setResult] = useState<RateOcrResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const replacePreviewUrl = (file: File | null) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
  };

  const reset = () => {
    replacePreviewUrl(null);
    setSelectedFileName(null);
    setResult(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    replacePreviewUrl(file);
    setSelectedFileName(file.name);
    setResult(null);
    setError(null);
    setIsAnalyzing(true);

    try {
      const nextResult =
        mode === 'RATE'
          ? await recognizeRateValueFromFile(file)
          : await recognizeDcValueFromFile(file);
      setResult(nextResult);

      if (nextResult.value == null) {
        setError(t('duel.valueImageRecognitionNoValue'));
        return;
      }

      onValueDetected(nextResult.value);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t('duel.valueImageRecognitionError')));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      className="rounded-xl border p-3 space-y-3"
      style={{
        borderColor: 'var(--color-border)',
        background: 'color-mix(in srgb, var(--color-surface) 82%, transparent)',
      }}
    >
      <div className="space-y-1">
        <div className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
          {t('duel.valueImageRecognitionTitle')}
        </div>
        <p className="text-xs leading-5" style={{ color: 'var(--color-on-surface-muted)' }}>
          {t('duel.valueImageRecognitionDescription', {
            mode: mode === 'RATE' ? t('duel.rateValue') : t('duel.dcValue'),
          })}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          onChange={(event) => {
            void handleFileChange(event);
          }}
          className="hidden"
        />
        <label htmlFor={inputId} className="themed-btn themed-btn-ghost cursor-pointer">
          {selectedFileName
            ? t('duel.valueImageRecognitionRetry')
            : t('duel.valueImageRecognitionSelect')}
        </label>
        {selectedFileName && (
          <button type="button" onClick={reset} className="themed-btn themed-btn-ghost">
            {t('duel.valueImageRecognitionClear')}
          </button>
        )}
        {selectedFileName && (
          <span className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>
            {t('duel.valueImageRecognitionSelected', { name: selectedFileName })}
          </span>
        )}
      </div>

      {previewUrl && (
        <img
          src={previewUrl}
          alt={t('duel.valueImageRecognitionTitle')}
          className="w-full max-h-56 object-contain rounded-lg border"
          style={{ borderColor: 'var(--color-border)' }}
        />
      )}

      {isAnalyzing && (
        <div className="text-sm" style={{ color: 'var(--color-primary)' }}>
          {t('duel.valueImageRecognitionProcessing')}
        </div>
      )}

      {!isAnalyzing && result?.value != null && (
        <div className="space-y-1">
          <div className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
            {t('duel.valueImageRecognitionDetected')}: {result.value}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>
            {t('duel.valueImageRecognitionApplied')}
            {result.attemptLabel ? ` (${result.attemptLabel})` : ''}
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm" style={{ color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {!isAnalyzing && result?.rawText && (
        <div className="space-y-1">
          <div className="text-xs font-medium" style={{ color: 'var(--color-on-surface-muted)' }}>
            {t('duel.valueImageRecognitionRawText')}
          </div>
          <div
            className="rounded-lg border px-3 py-2 text-xs whitespace-pre-wrap"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-on-surface-muted)',
            }}
          >
            {result.rawText}
          </div>
        </div>
      )}
    </div>
  );
}
