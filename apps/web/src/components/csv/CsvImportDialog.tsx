import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

type Props = {
  open: boolean;
  onClose: () => void;
};

type ImportResult = {
  imported: number;
  errors: string[];
};

export function CsvImportDialog({ open, onClose }: Props) {
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
      const response = await fetch('/api/duels/import', {
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

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={handleClose}
        onKeyDown={handleBackdropKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-bold">CSVインポート</h2>

        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            CSV形式のファイルを選択してインポートしてください。
          </p>
          <p className="text-xs text-gray-400">
            必須列: deck_name, opponent_deck_name, result, game_mode, is_first, won_coin_toss,
            dueled_at
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {importMutation.isError && (
          <p className="text-sm text-red-600">エラー: {importMutation.error.message}</p>
        )}

        {result && (
          <div className="space-y-1">
            <p className="text-sm text-green-600">{result.imported}件をインポートしました</p>
            {result.errors.length > 0 && (
              <div className="text-xs text-red-600 max-h-24 overflow-y-auto">
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
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            閉じる
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {importMutation.isPending ? 'インポート中...' : 'インポート'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
