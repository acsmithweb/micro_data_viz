import {
  VizChart,
  ChartConfig,
  ChartCatalogEntry,
  formatDateByGranularity,
  getAggregateFunction,
  translate,
} from './VizChart';
import {
  BarChart,
  HorizontalBarChart,
  GroupedBarChart,
  StackedBarChart,
  LineChart,
  AreaChart,
  StackedAreaChart,
} from './BarAndLineCharts';
import {
  ScatterPlotChart,
  BubbleChart,
  HistogramChart,
  BoxPlotChart,
  HeatmapChart,
} from './DistributionAndScatterCharts';
import {
  PieChart,
  DonutChart,
  TreemapChart,
  FunnelChart,
} from './ProportionAndHierarchyCharts';
import {
  RadarChart,
  RadialBarChart,
  WordCloudChart,
  TableChart,
} from './PolarAndSpecialCharts';

export type ChartConstructor = new (
  containerElement: HTMLElement,
  config?: ChartConfig
) => VizChart;

export const CHART_REGISTRY: Record<string, ChartConstructor> = {
  'Bar Chart': BarChart,
  'Horizontal Bar Chart': HorizontalBarChart,
  'Grouped Bar Chart': GroupedBarChart,
  'Stacked Bar Chart': StackedBarChart,
  'Line Chart': LineChart,
  'Area Chart': AreaChart,
  'Stacked Area Chart': StackedAreaChart,
  'Scatter Plot': ScatterPlotChart,
  'Bubble Chart': BubbleChart,
  'Histogram': HistogramChart,
  'Box Plot': BoxPlotChart,
  'Heatmap': HeatmapChart,
  'Pie Chart': PieChart,
  'Donut Chart': DonutChart,
  'Treemap': TreemapChart,
  'Funnel Chart': FunnelChart,
  'Radar Chart': RadarChart,
  'Radial Bar Chart': RadialBarChart,
  'Word Cloud Chart': WordCloudChart,
  'Table Chart': TableChart,
};

export const CHART_CATALOG: ChartCatalogEntry[] = [
  {
    type: 'Bar Chart',
    category: 'Comparison',
    description: 'Vertical categorical comparison bars with hover readouts.',
    supportsSeries: false,
    icon: 'bi-bar-chart-fill',
  },
  {
    type: 'Horizontal Bar Chart',
    category: 'Comparison',
    description: 'Sorted horizontal bars ideal for long category names.',
    supportsSeries: false,
    icon: 'bi-bar-chart-steps',
  },
  {
    type: 'Grouped Bar Chart',
    category: 'Comparison',
    description: 'Side-by-side multi-series comparison across categories.',
    supportsSeries: true,
    icon: 'bi-bar-chart-line',
  },
  {
    type: 'Stacked Bar Chart',
    category: 'Composition',
    description: 'Part-to-whole stacked bars broken down by series.',
    supportsSeries: true,
    icon: 'bi-layers-fill',
  },
  {
    type: 'Line Chart',
    category: 'Trend',
    description: 'Smooth monotone trend line with interactive markers.',
    supportsSeries: false,
    icon: 'bi-graph-up',
  },
  {
    type: 'Area Chart',
    category: 'Trend',
    description: 'Gradient-shaded area progression over ordered intervals.',
    supportsSeries: false,
    icon: 'bi-soundwave',
  },
  {
    type: 'Stacked Area Chart',
    category: 'Trend',
    description: 'Cumulative multi-series area composition over time.',
    supportsSeries: true,
    icon: 'bi-stack',
  },
  {
    type: 'Scatter Plot',
    category: 'Correlation',
    description: 'X/Y coordinate dispersion with optional category grouping.',
    supportsSeries: true,
    icon: 'bi-asterisk',
  },
  {
    type: 'Bubble Chart',
    category: 'Composition',
    description: 'D3 circle-packing layout sized proportionally by metric.',
    supportsSeries: true,
    icon: 'bi-circle-fill',
  },
  {
    type: 'Histogram',
    category: 'Distribution',
    description: 'Automatic D3 binning of numeric value frequencies.',
    supportsSeries: false,
    icon: 'bi-bar-chart',
  },
  {
    type: 'Box Plot',
    category: 'Distribution',
    description: 'Quartiles, median, IQR whiskers, and statistical outliers.',
    supportsSeries: false,
    icon: 'bi-distribute-vertical',
  },
  {
    type: 'Heatmap',
    category: 'Correlation',
    description: '2D matrix intensity grid with sequential color ramp.',
    supportsSeries: true,
    icon: 'bi-grid-3x3-gap-fill',
  },
  {
    type: 'Pie Chart',
    category: 'Composition',
    description: 'Classic proportional slices with percentage labels.',
    supportsSeries: false,
    icon: 'bi-pie-chart-fill',
  },
  {
    type: 'Donut Chart',
    category: 'Composition',
    description: 'Ring breakdown displaying aggregate KPI in the center.',
    supportsSeries: false,
    icon: 'bi-vinyl-fill',
  },
  {
    type: 'Treemap',
    category: 'Composition',
    description: 'Space-filling proportional hierarchy rectangles.',
    supportsSeries: true,
    icon: 'bi-grid-1x2-fill',
  },
  {
    type: 'Funnel Chart',
    category: 'Composition',
    description: 'Sequential stage conversion and retention drop-off view.',
    supportsSeries: false,
    icon: 'bi-funnel-fill',
  },
  {
    type: 'Radar Chart',
    category: 'Comparison',
    description: 'Polar multi-axis polygon comparison across dimensions.',
    supportsSeries: true,
    icon: 'bi-pentagon-fill',
  },
  {
    type: 'Radial Bar Chart',
    category: 'Comparison',
    description: 'Circular polar bars radiating from a central ring.',
    supportsSeries: false,
    icon: 'bi-bullseye',
  },
  {
    type: 'Word Cloud Chart',
    category: 'Distribution',
    description: 'Weighted text layout powered by d3-cloud.',
    supportsSeries: false,
    icon: 'bi-cloud-fill',
  },
  {
    type: 'Table Chart',
    category: 'Tabular',
    description: 'High-density tabular view with selectable columns.',
    supportsSeries: false,
    icon: 'bi-table',
  },
];

export function registerChartsGlobally(): void {
  const w = window as unknown as Record<string, unknown>;
  w.CHART_REGISTRY = CHART_REGISTRY;
  w.CHART_CATALOG = CHART_CATALOG;
  w.formatDateByGranularity = formatDateByGranularity;
  w.getAggregateFunction = getAggregateFunction;
  w.translate = translate;
}

export {
  VizChart,
  BarChart,
  HorizontalBarChart,
  GroupedBarChart,
  StackedBarChart,
  LineChart,
  AreaChart,
  StackedAreaChart,
  ScatterPlotChart,
  BubbleChart,
  HistogramChart,
  BoxPlotChart,
  HeatmapChart,
  PieChart,
  DonutChart,
  TreemapChart,
  FunnelChart,
  RadarChart,
  RadialBarChart,
  WordCloudChart,
  TableChart,
  formatDateByGranularity,
  getAggregateFunction,
};
export type { ChartConfig, ChartCatalogEntry };
