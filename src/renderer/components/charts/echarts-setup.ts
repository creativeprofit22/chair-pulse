import * as echarts from 'echarts/core';
import {
  LineChart,
  BarChart,
  PieChart,
  HeatmapChart,
  type LineSeriesOption,
  type BarSeriesOption,
  type PieSeriesOption,
  type HeatmapSeriesOption,
} from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  type TooltipComponentOption,
  type GridComponentOption,
  type LegendComponentOption,
  type DataZoomComponentOption,
  type VisualMapComponentOption,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  HeatmapChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  SVGRenderer,
]);

export type ECOption = echarts.ComposeOption<
  | LineSeriesOption
  | BarSeriesOption
  | PieSeriesOption
  | HeatmapSeriesOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | DataZoomComponentOption
  | VisualMapComponentOption
>;

export default echarts;
