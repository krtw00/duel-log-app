/**
 * チャートオプション用 Composable
 *
 * @description
 * ApexChartsの共通設定を提供し、アプリケーション全体で一貫したチャート表示を実現します。
 * テーマ（ライト/ダーク）に応じて動的にチャートの色やスタイルを調整します。
 *
 * @remarks
 * このComposableはStatisticsViewとSharedStatisticsViewで使用され、
 * 以下のチャートタイプに対応しています：
 * - 円グラフ（Pie Chart）: デッキ分布の表示
 * - 折れ線グラフ（Line Chart）: レート/DC値の推移表示
 *
 * テーマストアの変更を監視し、テーマが切り替わると自動的にチャートの
 * 色やスタイルが更新されます（computed値のため）。
 *
 * @example
 * ```typescript
 * import { useChartOptions } from '@/composables/useChartOptions';
 * import VueApexCharts from 'vue3-apexcharts';
 *
 * const { basePieChartOptions, baseLineChartOptions } = useChartOptions();
 *
 * // 円グラフで使用
 * const pieOptions = {
 *   ...basePieChartOptions.value,
 *   labels: ['デッキA', 'デッキB', 'デッキC']
 * };
 *
 * // 折れ線グラフで使用
 * const lineOptions = {
 *   ...baseLineChartOptions.value,
 *   xaxis: {
 *     ...baseLineChartOptions.value.xaxis,
 *     categories: ['1戦目', '2戦目', '3戦目']
 *   }
 * };
 * ```
 */

import { computed } from 'vue';
import { useThemeStore } from '../stores/theme';

/**
 * チャートの共通オプションを提供する Composable関数
 *
 * @returns {Object} チャートオプションオブジェクト
 * @returns {ComputedRef} basePieChartOptions - 円グラフの基本設定
 * @returns {ComputedRef} baseLineChartOptions - 折れ線グラフの基本設定
 */
export function useChartOptions() {
  // テーマストアからダークモード状態を取得
  const themeStore = useThemeStore();

  /**
   * 円グラフの基本オプション（Pie Chart）
   *
   * @returns {ApexOptions} ApexChartsの円グラフ設定オブジェクト
   *
   * @remarks
   * デッキ分布などの割合データの可視化に使用されます。
   *
   * 主な設定:
   * - テーマ: ダークモード/ライトモードに対応
   * - カラーパレット: 10色のカスタムカラーセット（視認性を考慮）
   * - 凡例: 下部に配置、モバイル対応
   * - データラベル: 無効化（グラフ内の数値表示なし）
   * - レスポンシブ: 画面幅480px以下で自動調整
   *
   * カラーパレット:
   * 1. シアン (#00D9FF) - メインカラー
   * 2. レッド (#FF4560)
   * 3. パープル (#775DD0)
   * 4. オレンジ (#FEB019)
   * 5. グリーン (#00E396)
   * 6. ピンク (#D4526E)
   * 7. ブルー (#3F51B5)
   * 8. ティール (#26A69A)
   * 9. マゼンタ (#E91E63)
   * 10. イエロー (#FFC107)
   *
   * @example
   * ```typescript
   * const options = {
   *   ...basePieChartOptions.value,
   *   labels: ['炎属性', '水属性', '地属性']
   * };
   * const series = [45, 30, 25]; // パーセンテージ
   * ```
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
   * 折れ線グラフの基本オプション（Line Chart）
   *
   * @returns {ApexOptions} ApexChartsの折れ線グラフ設定オブジェクト
   *
   * @remarks
   * レート値やDC値の推移など、時系列データの可視化に使用されます。
   *
   * 主な設定:
   * - テーマ: ダークモード/ライトモードに対応
   * - 曲線: スムーズな曲線（curve: 'smooth'）
   * - ズーム: 無効化（モバイルでの誤操作防止）
   * - ツールバー: 非表示（シンプルな見た目）
   * - マーカー: データポイントを強調表示
   * - グリッド: 半透明の破線
   * - データラベル: 無効化（ツールチップで表示）
   *
   * スタイリング:
   * - ライトモード: 黒文字 (#333)、白マーカー
   * - ダークモード: 明るい灰色文字 (#E4E7EC)、白マーカー
   * - ライン幅: 3px（視認性向上）
   * - マーカーサイズ: 4px
   *
   * @example
   * ```typescript
   * const options = {
   *   ...baseLineChartOptions.value,
   *   xaxis: {
   *     ...baseLineChartOptions.value.xaxis,
   *     categories: ['1月', '2月', '3月']
   *   },
   *   yaxis: {
   *     ...baseLineChartOptions.value.yaxis,
   *     title: { text: 'レート値' }
   *   }
   * };
   * const series = [{
   *   name: 'レート推移',
   *   data: [1500, 1550, 1600]
   * }];
   * ```
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
