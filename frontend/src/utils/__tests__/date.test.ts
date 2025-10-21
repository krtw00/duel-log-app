import { describe, it, expect } from 'vitest';
import {
  isoToLocalDateTime,
  localDateTimeToISO,
  formatDate,
  toDateString,
  getCurrentLocalDateTime,
} from '../date';

describe('date.ts', () => {
  describe('isoToLocalDateTime', () => {
    it('ISO形式の日時文字列をローカル日時に変換する', () => {
      // タイムゾーンに依存しないテストのため、固定の日時を使用
      const isoString = '2024-01-15T10:30:00.000Z';
      const result = isoToLocalDateTime(isoString);

      // ローカルタイムゾーンに応じた結果を期待
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('空文字列の場合は空文字列を返す', () => {
      expect(isoToLocalDateTime('')).toBe('');
    });
  });

  describe('localDateTimeToISO', () => {
    it('ローカル日時文字列をISO形式に変換する', () => {
      const localDateTime = '2024-01-15T19:30';
      const result = localDateTimeToISO(localDateTime);

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('空文字列の場合は空文字列を返す', () => {
      expect(localDateTimeToISO('')).toBe('');
    });

    it('isoToLocalDateTime と localDateTimeToISO は相互変換可能', () => {
      const originalISO = new Date('2024-01-15T10:30:00Z').toISOString();
      const localDateTime = isoToLocalDateTime(originalISO);
      const backToISO = localDateTimeToISO(localDateTime);

      // 両方ともDateオブジェクトに変換して比較（ミリ秒の違いを吸収）
      const originalDate = new Date(originalISO);
      const convertedDate = new Date(backToISO);

      expect(convertedDate.getTime()).toBe(originalDate.getTime());
    });
  });

  describe('formatDate', () => {
    it('ISO文字列を読みやすい形式にフォーマットする（時刻あり）', () => {
      const date = new Date('2024-01-15T19:30:00Z');
      const result = formatDate(date.toISOString(), true);

      expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    });

    it('ISO文字列を読みやすい形式にフォーマットする（時刻なし）', () => {
      const date = new Date('2024-01-15T19:30:00Z');
      const result = formatDate(date.toISOString(), false);

      expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
    });

    it('デフォルトでは時刻を含む', () => {
      const date = new Date('2024-01-15T19:30:00Z');
      const result = formatDate(date.toISOString());

      expect(result).toContain(':');
    });

    it('空文字列の場合は空文字列を返す', () => {
      expect(formatDate('')).toBe('');
    });
  });

  describe('toDateString', () => {
    it('DateオブジェクトをYYYY-MM-DD形式に変換する', () => {
      const date = new Date('2024-01-15T19:30:00Z');
      const result = toDateString(date);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const expected = `${year}-${month}-${day}`;

      expect(result).toBe(expected);
    });

    it('1桁の月日をゼロパディングする', () => {
      const date = new Date('2024-01-05T10:00:00Z');
      const result = toDateString(date);

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getCurrentLocalDateTime', () => {
    it('現在のローカル日時文字列を取得する', () => {
      const result = getCurrentLocalDateTime();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });
});
