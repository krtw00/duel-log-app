/**
 * クリップボードにテキストをコピーする。
 * navigator.clipboard が使えない環境（モバイルブラウザ、Linux の一部環境）では
 * execCommand フォールバックを使用する。
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Clipboard API が使える場合はそちらを優先
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // セキュリティ制約等で失敗 → フォールバックへ
    }
  }

  // execCommand フォールバック
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // 画面外に配置して視覚的に見えないようにする
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
