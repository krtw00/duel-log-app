import { describe, it, expect } from 'vitest';
import {
  GAME_MODE_CONFIG,
  GAME_MODES_LIST,
  GAME_MODE_OPTIONS,
  VALUE_GAME_MODES,
  getGameModeLabel,
  getGameModeIcon,
  getGameModeColor,
  gameModeHasValueField,
  isValidGameMode,
  getValueByGameMode,
  forEachGameMode,
} from '../gameMode';
import type { GameMode } from '../../types';

describe('gameMode utilities', () => {
  describe('GAME_MODE_CONFIG', () => {
    it('should have config for all game modes', () => {
      expect(GAME_MODE_CONFIG).toHaveProperty('RANK');
      expect(GAME_MODE_CONFIG).toHaveProperty('RATE');
      expect(GAME_MODE_CONFIG).toHaveProperty('EVENT');
      expect(GAME_MODE_CONFIG).toHaveProperty('DC');
    });

    it('should have correct structure for each mode', () => {
      for (const mode of GAME_MODES_LIST) {
        const config = GAME_MODE_CONFIG[mode];
        expect(config).toHaveProperty('value', mode);
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('icon');
        expect(config).toHaveProperty('color');
        expect(config).toHaveProperty('hasValueField');
      }
    });

    it('should have valueLabel for modes with hasValueField', () => {
      for (const mode of GAME_MODES_LIST) {
        const config = GAME_MODE_CONFIG[mode];
        if (config.hasValueField) {
          expect(config.valueLabel).toBeDefined();
        }
      }
    });
  });

  describe('GAME_MODES_LIST', () => {
    it('should contain all 4 game modes', () => {
      expect(GAME_MODES_LIST).toHaveLength(4);
      expect(GAME_MODES_LIST).toContain('RANK');
      expect(GAME_MODES_LIST).toContain('RATE');
      expect(GAME_MODES_LIST).toContain('EVENT');
      expect(GAME_MODES_LIST).toContain('DC');
    });

    it('should maintain correct order', () => {
      expect(GAME_MODES_LIST[0]).toBe('RANK');
      expect(GAME_MODES_LIST[1]).toBe('RATE');
      expect(GAME_MODES_LIST[2]).toBe('EVENT');
      expect(GAME_MODES_LIST[3]).toBe('DC');
    });
  });

  describe('GAME_MODE_OPTIONS', () => {
    it('should have correct structure for select box', () => {
      expect(GAME_MODE_OPTIONS).toHaveLength(4);
      for (const option of GAME_MODE_OPTIONS) {
        expect(option).toHaveProperty('title');
        expect(option).toHaveProperty('value');
        expect(typeof option.title).toBe('string');
        expect(GAME_MODES_LIST).toContain(option.value);
      }
    });

    it('should match labels from config', () => {
      for (const option of GAME_MODE_OPTIONS) {
        const config = GAME_MODE_CONFIG[option.value as GameMode];
        expect(option.title).toBe(config.label);
      }
    });
  });

  describe('VALUE_GAME_MODES', () => {
    it('should contain only modes with value fields', () => {
      expect(VALUE_GAME_MODES).toContain('RANK');
      expect(VALUE_GAME_MODES).toContain('RATE');
      expect(VALUE_GAME_MODES).toContain('DC');
      expect(VALUE_GAME_MODES).not.toContain('EVENT');
    });

    it('should have length of 3', () => {
      expect(VALUE_GAME_MODES).toHaveLength(3);
    });
  });

  describe('getGameModeLabel', () => {
    it('should return correct labels', () => {
      expect(getGameModeLabel('RANK')).toBe('ランク');
      expect(getGameModeLabel('RATE')).toBe('レート');
      expect(getGameModeLabel('EVENT')).toBe('イベント');
      expect(getGameModeLabel('DC')).toBe('DC');
    });
  });

  describe('getGameModeIcon', () => {
    it('should return correct icons', () => {
      expect(getGameModeIcon('RANK')).toBe('mdi-crown');
      expect(getGameModeIcon('RATE')).toBe('mdi-chart-line');
      expect(getGameModeIcon('EVENT')).toBe('mdi-calendar-star');
      expect(getGameModeIcon('DC')).toBe('mdi-trophy-variant');
    });
  });

  describe('getGameModeColor', () => {
    it('should return correct colors', () => {
      expect(getGameModeColor('RANK')).toBe('primary');
      expect(getGameModeColor('RATE')).toBe('info');
      expect(getGameModeColor('EVENT')).toBe('secondary');
      expect(getGameModeColor('DC')).toBe('warning');
    });
  });

  describe('gameModeHasValueField', () => {
    it('should return true for RANK, RATE, DC', () => {
      expect(gameModeHasValueField('RANK')).toBe(true);
      expect(gameModeHasValueField('RATE')).toBe(true);
      expect(gameModeHasValueField('DC')).toBe(true);
    });

    it('should return false for EVENT', () => {
      expect(gameModeHasValueField('EVENT')).toBe(false);
    });
  });

  describe('isValidGameMode', () => {
    it('should return true for valid game modes', () => {
      expect(isValidGameMode('RANK')).toBe(true);
      expect(isValidGameMode('RATE')).toBe(true);
      expect(isValidGameMode('EVENT')).toBe(true);
      expect(isValidGameMode('DC')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isValidGameMode('INVALID')).toBe(false);
      expect(isValidGameMode('')).toBe(false);
      expect(isValidGameMode(null)).toBe(false);
      expect(isValidGameMode(undefined)).toBe(false);
      expect(isValidGameMode(123)).toBe(false);
      expect(isValidGameMode({})).toBe(false);
      expect(isValidGameMode([])).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isValidGameMode('rank')).toBe(false);
      expect(isValidGameMode('Rank')).toBe(false);
      expect(isValidGameMode('rate')).toBe(false);
    });
  });

  describe('getValueByGameMode', () => {
    it('should return correct value from record', () => {
      const data: Record<GameMode, number> = {
        RANK: 100,
        RATE: 200,
        EVENT: 300,
        DC: 400,
      };

      expect(getValueByGameMode(data, 'RANK')).toBe(100);
      expect(getValueByGameMode(data, 'RATE')).toBe(200);
      expect(getValueByGameMode(data, 'EVENT')).toBe(300);
      expect(getValueByGameMode(data, 'DC')).toBe(400);
    });

    it('should work with different value types', () => {
      const stringData: Record<GameMode, string> = {
        RANK: 'rank-value',
        RATE: 'rate-value',
        EVENT: 'event-value',
        DC: 'dc-value',
      };

      expect(getValueByGameMode(stringData, 'RANK')).toBe('rank-value');
    });
  });

  describe('forEachGameMode', () => {
    it('should iterate over all game modes', () => {
      const results = forEachGameMode((mode) => mode);
      expect(results).toEqual(['RANK', 'RATE', 'EVENT', 'DC']);
    });

    it('should pass config to callback', () => {
      const results = forEachGameMode((mode, config) => ({
        mode,
        label: config.label,
      }));

      expect(results).toHaveLength(4);
      expect(results[0]).toEqual({ mode: 'RANK', label: 'ランク' });
      expect(results[1]).toEqual({ mode: 'RATE', label: 'レート' });
      expect(results[2]).toEqual({ mode: 'EVENT', label: 'イベント' });
      expect(results[3]).toEqual({ mode: 'DC', label: 'DC' });
    });

    it('should return array of callback results', () => {
      const results = forEachGameMode((mode, config) => config.hasValueField);
      expect(results).toEqual([true, true, false, true]);
    });
  });
});
