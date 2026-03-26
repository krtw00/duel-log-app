import { useState } from 'react';

export function useStatsImageDownload() {
  const [generating, setGenerating] = useState(false);

  const capture = async (element: HTMLElement) => {
    const { default: html2canvas } = await import('html2canvas-pro');
    return html2canvas(element, {
      width: 1200,
      height: 675,
      scale: 2,
      useCORS: true,
      backgroundColor: '#0a0e27',
    });
  };

  const download = async (element: HTMLElement) => {
    setGenerating(true);
    try {
      const canvas = await capture(element);
      const link = document.createElement('a');
      link.download = 'duel-log-stats.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (element: HTMLElement) => {
    setGenerating(true);
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        return false;
      }

      const canvas = await capture(element);
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((value) => resolve(value), 'image/png');
      });

      if (!blob) {
        return false;
      }

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    } catch {
      return false;
    } finally {
      setGenerating(false);
    }
  };

  return { download, copyToClipboard, generating };
}
