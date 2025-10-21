import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, createLogger } from '../logger';

describe('logger.ts', () => {
  let consoleLogSpy: any;
  let consoleInfoSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;
  let consoleDebugSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Logger class', () => {
    it('プレフィックス付きでログを出力する', () => {
      const logger = new Logger('TestComponent');
      logger.log('test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls[0];
      expect(callArgs.join(' ')).toContain('[TestComponent]');
      expect(callArgs.join(' ')).toContain('test message');
    });

    it('info メソッドでログを出力する', () => {
      const logger = new Logger('TestComponent');
      logger.info('info message');

      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('warn メソッドでログを出力する', () => {
      const logger = new Logger('TestComponent');
      logger.warn('warning message');

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('error メソッドでログを出力する（本番環境でも出力）', () => {
      const logger = new Logger('TestComponent');
      logger.error('error message');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const callArgs = consoleErrorSpy.mock.calls[0];
      expect(callArgs.join(' ')).toContain('[TestComponent]');
      expect(callArgs.join(' ')).toContain('error message');
    });

    it('debug メソッドでログを出力する', () => {
      const logger = new Logger('TestComponent');
      logger.debug('debug message');

      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });

  describe('createLogger', () => {
    it('指定したプレフィックスでLoggerインスタンスを作成する', () => {
      const logger = createLogger('CustomPrefix');
      logger.log('test');

      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls[0];
      expect(callArgs.join(' ')).toContain('[CustomPrefix]');
    });
  });

  describe('タイムスタンプ', () => {
    it('ログにタイムスタンプが含まれる', () => {
      const logger = new Logger('Test');
      logger.log('message');

      const callArgs = consoleLogSpy.mock.calls[0];
      const output = callArgs.join(' ');

      // タイムスタンプのパターン [HH:MM:SS] をチェック
      expect(output).toMatch(/\[\d{1,2}:\d{2}:\d{2}.*\]/);
    });
  });

  describe('複数の引数', () => {
    it('複数の引数を渡してログ出力できる', () => {
      const logger = new Logger('Test');
      const obj = { key: 'value' };
      logger.log('message', obj, 123);

      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls[0];
      expect(callArgs).toContain('message');
      expect(callArgs).toContain(obj);
      expect(callArgs).toContain(123);
    });
  });
});
