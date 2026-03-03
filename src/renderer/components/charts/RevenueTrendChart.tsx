import { useMemo } from 'react';
import EChartsWrapper from './EChartsWrapper';
import type { ECOption } from './echarts-setup';
import type { RevenueWeekly } from '../../../core/types/analysis';

interface RevenueTrendChartProps {
  data: RevenueWeekly[];
  direction: 'up' | 'down' | 'flat';
}

export default function RevenueTrendChart({ data, direction }: RevenueTrendChartProps) {
  const option = useMemo((): ECOption => {
    const lineColor = direction === 'up' ? '#00cec9' : direction === 'down' ? '#ff6b6b' : '#fdcb6e';

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = params as { name: string; data: number }[];
          const item = p[0];
          return `<strong>Week of ${item.name}</strong><br/>Revenue: £${item.data.toFixed(0)}`;
        },
      },
      grid: {
        top: 20,
        right: 20,
        bottom: 30,
        left: 10,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => formatWeekLabel(d.weekStart)),
        axisLabel: {
          color: 'var(--text-muted)',
          fontSize: 10,
          rotate: data.length > 8 ? 30 : 0,
        },
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: 'var(--text-muted)',
          fontSize: 10,
          formatter: (v: number) => `£${v}`,
        },
        splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          data: data.map((d) => Math.round(d.total)),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: lineColor, width: 2 },
          itemStyle: { color: lineColor },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: lineColor + '40' },
                { offset: 1, color: lineColor + '05' },
              ],
            },
          },
        },
      ],
    };
  }, [data, direction]);

  return <EChartsWrapper option={option} style={{ height: '280px' }} />;
}

function formatWeekLabel(date: Date): string {
  const d = new Date(date);
  const month = d.toLocaleString('en-GB', { month: 'short' });
  return `${d.getDate()} ${month}`;
}
