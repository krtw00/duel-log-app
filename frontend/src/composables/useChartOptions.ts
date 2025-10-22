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
    chart: { type: 'pie', background: 'transparent' },
    labels: [],
    theme: {
      mode: themeStore.isDark ? 'dark' : 'light',
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
      position: 'bottom',
      labels: {
        colors: themeStore.isDark ? '#fff' : '#000',
      },
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
      type: 'line',
      background: 'transparent',
      zoom: { enabled: false },
      toolbar: { show: false },
    },
    xaxis: {
      type: 'numeric',
      title: { text: '対戦数', style: { color: themeStore.isDark ? '#E4E7EC' : '#333' } },
      labels: { style: { colors: themeStore.isDark ? '#E4E7EC' : '#333' } },
    },
    yaxis: { labels: { style: { colors: themeStore.isDark ? '#E4E7EC' : '#333' } } },
    stroke: { curve: 'smooth', width: 3 },
    markers: {
      size: 4,
      colors: ['#00d9ff'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: { size: 7 },
    },
    grid: { borderColor: 'rgba(0, 217, 255, 0.1)', strokeDashArray: 4 },
    tooltip: { theme: themeStore.isDark ? 'dark' : 'light' },
    dataLabels: { enabled: false },
    theme: { mode: themeStore.isDark ? 'dark' : 'light' },
  }));

  return {
    basePieChartOptions,
    baseLineChartOptions,
  };
}
