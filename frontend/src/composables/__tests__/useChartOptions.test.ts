import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useChartOptions } from '../useChartOptions';
import { useThemeStore } from '@/stores/theme';

describe('useChartOptions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('basePieChartOptions', () => {
    it('ダークモードでチャートオプションを生成', () => {
      const { basePieChartOptions } = useChartOptions();

      expect(basePieChartOptions.value.theme.mode).toBe('dark');
      expect(basePieChartOptions.value.chart.type).toBe('pie');
      expect(basePieChartOptions.value.chart.background).toBe('transparent');
      expect(basePieChartOptions.value.dataLabels.enabled).toBe(false);
      expect(basePieChartOptions.value.legend.show).toBe(true);
      expect(basePieChartOptions.value.legend.position).toBe('bottom');
      expect(basePieChartOptions.value.legend.labels?.colors).toBe('#fff');
    });

    it('ライトモードでチャートオプションを生成', () => {
      const themeStore = useThemeStore();
      // テーマストアの内部状態を直接更新
      themeStore.themeName = 'customLightTheme';
      (themeStore as any).isDark = false;

      const { basePieChartOptions } = useChartOptions();

      expect(basePieChartOptions.value.theme.mode).toBe('light');
      expect(basePieChartOptions.value.legend.labels?.colors).toBe('#000');
    });

    it('適切な色配列を持つ', () => {
      const { basePieChartOptions } = useChartOptions();

      expect(basePieChartOptions.value.colors).toEqual([
        '#00D9FF',
        '#FF4560',
        '#775DD0',
        '#FEB019',
        '#00E396',
        '#D4526E',
        '#3F51B5',
        '#26A69A',
        '#E91E63',
        '#FFC107',
      ]);
    });

  });

  describe('baseLineChartOptions', () => {
    it('ダークモードでラインチャートオプションを生成', () => {
      const { baseLineChartOptions } = useChartOptions();

      expect(baseLineChartOptions.value.theme.mode).toBe('dark');
      expect(baseLineChartOptions.value.chart.type).toBe('line');
      expect(baseLineChartOptions.value.chart.background).toBe('transparent');
      expect(baseLineChartOptions.value.chart.zoom?.enabled).toBe(false);
      expect(baseLineChartOptions.value.chart.toolbar?.show).toBe(false);
      expect(baseLineChartOptions.value.dataLabels.enabled).toBe(false);
      expect(baseLineChartOptions.value.tooltip.theme).toBe('dark');
    });

    it('ライトモードでラインチャートオプションを生成', () => {
      const themeStore = useThemeStore();
      // テーマストアの内部状態を直接更新
      themeStore.themeName = 'customLightTheme';
      (themeStore as any).isDark = false;

      const { baseLineChartOptions } = useChartOptions();

      expect(baseLineChartOptions.value.theme.mode).toBe('light');
      expect(baseLineChartOptions.value.tooltip.theme).toBe('light');
    });

    it('適切なストロークとマーカー設定を持つ', () => {
      const { baseLineChartOptions } = useChartOptions();

      expect(baseLineChartOptions.value.stroke.curve).toBe('smooth');
      expect(baseLineChartOptions.value.stroke.width).toBe(3);
      expect(baseLineChartOptions.value.markers.size).toBe(4);
      expect(baseLineChartOptions.value.markers.colors).toEqual(['#00d9ff']);
      expect(baseLineChartOptions.value.markers.strokeColors).toEqual(['#fff']);
      expect(baseLineChartOptions.value.markers.strokeWidth).toBe(2);
    });

    it('xaxis設定を持つ', () => {
      const { baseLineChartOptions } = useChartOptions();

      expect(baseLineChartOptions.value.xaxis.categories).toEqual([]);
      expect(baseLineChartOptions.value.xaxis.labels).toBeDefined();
    });

    it('グリッド設定を持つ', () => {
      const { baseLineChartOptions } = useChartOptions();

      expect(baseLineChartOptions.value.grid.borderColor).toBe('rgba(0, 217, 255, 0.1)');
      expect(baseLineChartOptions.value.grid.strokeDashArray).toBe(4);
    });
  });
});
