import { useState } from 'react';

export function useStatsImageDownload() {
  const [generating, setGenerating] = useState(false);

  const download = async (element: HTMLElement) => {
    setGenerating(true);
    try {
      const { default: html2canvas } = await import('html2canvas-pro');
      const canvas = await html2canvas(element, {
        width: 1200,
        height: 675,
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0e27',
      });
      const link = document.createElement('a');
      link.download = 'duel-log-stats.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setGenerating(false);
    }
  };

  return { download, generating };
}
