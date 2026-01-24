import type { GameMode } from '@duel-log/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase.js';

type Props = {
  open: boolean;
  onClose: () => void;
  gameMode?: GameMode;
};

type ImportResult = {
  imported: number;
  errors: string[];
};

export function CsvImportDialog({ open, onClose, gameMode }: Props) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (csvFile: File) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const text = await csvFile.text();
      const params = new URLSearchParams();
      if (gameMode) params.set('gameMode', gameMode);
      const qs = params.toString();
      const url = `/api/duels/import${qs ? `?${qs}` : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'text/csv',
        },
        body: text,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const msg =
          (errorBody as { error?: { message?: string } }).error?.message ?? 'Import failed';
        throw new Error(msg);
      }

      return response.json() as Promise<{ data: ImportResult }>;
    },
    onSuccess: (data) => {
      setResult(data.data);
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
  };

  const handleImport = () => {
    if (!file) return;
    importMutation.mutate(file);
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    importMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={handleClose} onKeyDown={(e) => { if (e.key === 'Escape') handleClose(); }} role="button" tabIndex={0} aria-label="Close dialog">
      <div className="dialog-content max-w-md" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="dialog" tabIndex={-1}>
        <div className="dialog-header">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>
            {t('csv.importTitle')}
          </h2>
        </div>

        <div className="dialog-body space-y-4">
          <div className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
              {t('csv.importDescription')}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)', opacity: 0.7 }}>
              {t(gameMode ? 'csv.requiredColumnsFiltered' : 'csv.requiredColumns')}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:cursor-pointer"
            style={{ color: 'var(--color-on-surface-muted)' }}
          />

          {importMutation.isError && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>
              {t('csv.importError', { message: importMutation.error.message })}
            </p>
          )}

          {result && (
            <div className="space-y-1">
              <p className="text-sm" style={{ color: 'var(--color-success)' }}>
                {t('csv.importSuccess', { count: result.imported })}
              </p>
              {result.errors.length > 0 && (
                <div className="text-sm max-h-24 overflow-y-auto" style={{ color: 'var(--color-error)' }}>
                  {result.errors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="themed-btn themed-btn-ghost"
            >
              {t('common.close')}
            </button>
            {!result && (
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || importMutation.isPending}
                className="themed-btn themed-btn-primary"
              >
                {importMutation.isPending ? t('csv.importing') : t('common.import')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
