/**
 * Chart.js および ApexCharts の型定義
 */

/**
 * ApexCharts のテーマ設定
 */
export interface ApexTheme {
  mode: 'light' | 'dark';
  palette?: string;
}

/**
 * ApexCharts のチャート設定
 */
export interface ApexChart {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'radialBar';
  height?: number | string;
  width?: number | string;
  background?: string;
  foreColor?: string;
  fontFamily?: string;
  animations?: {
    enabled?: boolean;
    speed?: number;
  };
  toolbar?: {
    show?: boolean;
  };
}

/**
 * ApexCharts のデータラベル設定
 */
export interface ApexDataLabels {
  enabled: boolean;
  formatter?: (val: number) => string;
  style?: {
    fontSize?: string;
    fontWeight?: string | number;
    colors?: string[];
  };
}

/**
 * ApexCharts の凡例設定
 */
export interface ApexLegend {
  show: boolean;
  position?: 'top' | 'right' | 'bottom' | 'left';
  horizontalAlign?: 'left' | 'center' | 'right';
  labels?: {
    colors?: string | string[];
  };
}

/**
 * ApexCharts のプロット設定
 */
export interface ApexPlotOptions {
  pie?: {
    donut?: {
      size?: string;
      labels?: {
        show?: boolean;
        name?: {
          show?: boolean;
          fontSize?: string;
          color?: string;
        };
        value?: {
          show?: boolean;
          fontSize?: string;
          color?: string;
          formatter?: (val: number) => string;
        };
        total?: {
          show?: boolean;
          label?: string;
          color?: string;
          formatter?: (w: { globals: { seriesTotals: number[] } }) => string;
        };
      };
    };
  };
}

/**
 * ApexCharts のストローク設定
 */
export interface ApexStroke {
  curve?: 'smooth' | 'straight' | 'stepline';
  width?: number;
  colors?: string[];
}

/**
 * ApexCharts のマーカー設定
 */
export interface ApexMarkers {
  size?: number;
  colors?: string[];
  strokeColors?: string[];
  strokeWidth?: number;
}

/**
 * ApexCharts のX軸設定
 */
export interface ApexXAxis {
  categories?: string[];
  labels?: {
    style?: {
      colors?: string | string[];
      fontSize?: string;
    };
  };
  axisBorder?: {
    color?: string;
  };
  axisTicks?: {
    color?: string;
  };
}

/**
 * ApexCharts のY軸設定
 */
export interface ApexYAxis {
  min?: number;
  max?: number;
  labels?: {
    style?: {
      colors?: string | string[];
      fontSize?: string;
    };
    formatter?: (val: number) => string;
  };
}

/**
 * ApexCharts のグリッド設定
 */
export interface ApexGrid {
  borderColor?: string;
  strokeDashArray?: number;
}

/**
 * ApexCharts のツールチップ設定
 */
export interface ApexTooltip {
  enabled?: boolean;
  theme?: 'light' | 'dark';
  y?: {
    formatter?: (val: number) => string;
  };
}

/**
 * ApexCharts の基本オプション（円グラフ用）
 */
export interface ApexPieChartOptions {
  chart: ApexChart;
  labels: string[];
  theme: ApexTheme;
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  plotOptions?: ApexPlotOptions;
  colors?: string[];
}

/**
 * ApexCharts の基本オプション（折れ線グラフ用）
 */
export interface ApexLineChartOptions {
  chart: ApexChart;
  stroke: ApexStroke;
  markers: ApexMarkers;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  theme: ApexTheme;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  colors?: string[];
}

/**
 * ApexCharts のシリーズデータ（折れ線グラフ用）
 */
export interface ApexLineChartSeries {
  name: string;
  data: number[];
}

/**
 * グラフデータのラッパー（円グラフ用）
 */
export interface PieChartData {
  series: number[];
  labels: string[];
}

/**
 * グラフデータのラッパー（折れ線グラフ用）
 */
export interface LineChartData {
  series: ApexLineChartSeries[];
  categories: string[];
}
