/**
 * チャートオプション用 Composable
 * ApexChartsの共通設定を提供
 */

import { computed } from 'vue';
import { useThemeStore } from '../stores/theme';

/**
 * チャートの共通オプションを提供する
 * StatisticsView と SharedStatisticsView で使用される
 */
export function useChartOptions() {
  const themeStore = useThemeStore();

  /**
   * 円グラフの基本オプション
   */
  const basePieChartOptions = computed(() => ({
    chart: { type: 'pie' as const, background: 'transparent' },
    labels: [],
    theme: {
      mode: themeStore.isDark ? ('dark' as const) : ('light' as const),
    },
    colors: [
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
    ],
    legend: {
      show: true,
      position: 'bottom' as const,
      labels: {
        colors: themeStore.isDark ? '#fff' : '#000',
      },
    },
    tooltip: {
      theme: themeStore.isDark ? ('dark' as const) : ('light' as const),
      y: {
        formatter: (value: number, opts: any) => {
          const seriesIndex = Number(opts?.seriesIndex);
          const series = opts?.w?.globals?.series;
          const total = Array.isArray(series)
            ? series.reduce((sum: number, v: unknown) => sum + (Number(v) || 0), 0)
            : 0;
          const numericValue = Number.isFinite(value)
            ? value
            : Number(series?.[Number.isFinite(seriesIndex) ? seriesIndex : 0]);

          if (!Number.isFinite(numericValue)) return '0.0%';
          if (total <= 0) return numericValue > 0 ? '100.0%' : '0.0%';

          const percent = (numericValue / total) * 100;
          return `${percent.toFixed(1)}%`;
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: 'bottom' },
        },
      },
    ],
  }));

  /**
   * 折れ線グラフの基本オプション
   */
  const baseLineChartOptions = computed(() => ({
    chart: {
      type: 'line' as const,
      background: 'transparent',
      zoom: { enabled: false },
      toolbar: { show: false },
    },
    xaxis: {
      categories: [],
      labels: { style: { colors: themeStore.isDark ? '#E4E7EC' : '#333' } },
    },
    yaxis: { labels: { style: { colors: themeStore.isDark ? '#E4E7EC' : '#333' } } },
    stroke: { curve: 'smooth' as const, width: 3 },
    markers: {
      size: 4,
      colors: ['#00d9ff'],
      strokeColors: ['#fff'],
      strokeWidth: 2,
    },
    grid: { borderColor: 'rgba(0, 217, 255, 0.1)', strokeDashArray: 4 },
    tooltip: { theme: themeStore.isDark ? ('dark' as const) : ('light' as const) },
    dataLabels: { enabled: false },
    theme: { mode: themeStore.isDark ? ('dark' as const) : ('light' as const) },
  }));

  return {
    basePieChartOptions,
    baseLineChartOptions,
  };
}
