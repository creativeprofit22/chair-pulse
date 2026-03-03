import { useMemo } from 'react';
import EChartsWrapper from './EChartsWrapper';
import type { ECOption } from './echarts-setup';
import type { UtilizationAnalysis } from '../../../core/types/analysis';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface UtilizationHeatmapProps {
  data: UtilizationAnalysis;
}

export default function UtilizationHeatmap({ data }: UtilizationHeatmapProps) {
  const option = useMemo((): ECOption => {
    // Get unique sorted hours from cells
    const hours = [...new Set(data.cells.map((c) => c.hour))].sort((a, b) => a - b);
    const hourLabels = hours.map((h) => `${h}:00`);

    // Build heatmap data: [hourIndex, dayIndex, value]
    const heatmapData = data.cells.map((c) => {
      const hourIdx = hours.indexOf(c.hour);
      return [hourIdx, c.day, Math.round(c.utilizationPct)];
    });

    return {
      tooltip: {
        formatter: (params: unknown) => {
          const p = params as { data: number[] };
          const [hourIdx, dayIdx, val] = p.data;
          const cell = data.cells.find((c) => c.day === dayIdx && c.hour === hours[hourIdx]);
          return [
            `<strong>${DAY_LABELS[dayIdx]} ${hours[hourIdx]}:00</strong>`,
            `Utilization: ${val}%`,
            `Bookings: ${cell?.bookingCount ?? 0}`,
            `Revenue/hr: £${(cell?.revenuePerHour ?? 0).toFixed(0)}`,
          ].join('<br/>');
        },
      },
      grid: {
        top: 10,
        right: 80,
        bottom: 40,
        left: 50,
      },
      xAxis: {
        type: 'category',
        data: hourLabels,
        splitArea: { show: true },
        axisLabel: { color: 'var(--text-muted)', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: DAY_LABELS,
        splitArea: { show: true },
        axisLabel: { color: 'var(--text-muted)', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'vertical',
        right: 0,
        top: 'center',
        inRange: {
          color: ['#1a1b23', '#2d1b69', '#6c5ce7', '#00cec9', '#55efc4'],
        },
        textStyle: { color: 'var(--text-muted)', fontSize: 10 },
        formatter: '{value}%',
      },
      series: [
        {
          type: 'heatmap',
          data: heatmapData,
          emphasis: {
            itemStyle: { borderColor: '#fff', borderWidth: 1 },
          },
          itemStyle: {
            borderRadius: 3,
            borderWidth: 2,
            borderColor: 'var(--bg-primary)',
          },
        },
      ],
    };
  }, [data]);

  return <EChartsWrapper option={option} style={{ height: '320px' }} />;
}
