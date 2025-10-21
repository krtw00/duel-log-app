/**
 * 開発環境のみでログ出力を行うロガーユーティリティ
 */

const isDevelopment = import.meta.env.DEV;

/**
 * ログレベル
 */
type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

/**
 * ログ出力のベース関数
 * @param level - ログレベル
 * @param prefix - ログのプレフィックス
 * @param args - ログメッセージ
 */
function logWithLevel(level: LogLevel, prefix: string, ...args: any[]): void {
  if (!isDevelopment) return;

  const timestamp = new Date().toLocaleTimeString();
  const formattedPrefix = prefix ? `[${prefix}]` : '';

  console[level](`[${timestamp}]`, formattedPrefix, ...args);
}

/**
 * Logger クラス
 * 特定のコンテキスト（コンポーネント名など）を持つロガーを作成
 */
export class Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  /**
   * 通常ログ
   */
  log(...args: any[]): void {
    logWithLevel('log', this.prefix, ...args);
  }

  /**
   * 情報ログ
   */
  info(...args: any[]): void {
    logWithLevel('info', this.prefix, ...args);
  }

  /**
   * 警告ログ
   */
  warn(...args: any[]): void {
    logWithLevel('warn', this.prefix, ...args);
  }

  /**
   * エラーログ（本番環境でも出力）
   */
  error(...args: any[]): void {
    const timestamp = new Date().toLocaleTimeString();
    const formattedPrefix = this.prefix ? `[${this.prefix}]` : '';
    console.error(`[${timestamp}]`, formattedPrefix, ...args);
  }

  /**
   * デバッグログ
   */
  debug(...args: any[]): void {
    logWithLevel('debug', this.prefix, ...args);
  }
}

/**
 * デフォルトロガー（プレフィックスなし）
 */
export const logger = new Logger('App');

/**
 * 特定のコンテキスト用のロガーを作成
 * @param prefix - ログのプレフィックス（コンポーネント名など）
 * @returns Logger インスタンス
 *
 * @example
 * const logger = createLogger('Dashboard');
 * logger.info('Component mounted');
 * logger.error('Failed to fetch data', error);
 */
export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}

/**
 * グローバル関数（後方互換性のため）
 */

export const log = (...args: any[]): void => {
  if (isDevelopment) console.log(...args);
};

export const info = (...args: any[]): void => {
  if (isDevelopment) console.info(...args);
};

export const warn = (...args: any[]): void => {
  if (isDevelopment) console.warn(...args);
};

export const error = (...args: any[]): void => {
  console.error(...args);
};

export const debug = (...args: any[]): void => {
  if (isDevelopment) console.debug(...args);
};
