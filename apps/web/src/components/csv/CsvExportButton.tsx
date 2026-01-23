import type { GameMode } from '@duel-log/shared';
import { useState } from 'react';
import { supabase } from '../../lib/supabase.js';

type Props = {
  gameMode?: GameMode;
};

export function CsvExportButton({ gameMode }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const params = new URLSearchParams();
      if (gameMode) params.set('gameMode', gameMode);
      const qs = params.toString();
      const url = `/api/duels/export${qs ? `?${qs}` : ''}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `duels-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch {
      // export error silently handled
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
    >
      {exporting ? 'エクスポート中...' : 'CSV出力'}
    </button>
  );
}
