import { useMemo } from 'react';
import EChartsWrapper from './EChartsWrapper';
import type { ECOption } from './echarts-setup';
import type { ServiceMixEntry } from '../../../core/types/analysis';

interface ServiceMixChartProps {
  services: ServiceMixEntry[];
  mode: 'ranking' | 'share';
}

export default function ServiceMixChart({ services, mode }: ServiceMixChartProps) {
  const option = useMemo((): ECOption => {
    if (mode === 'share') {
      return {
        tooltip: {
          formatter: (params: unknown) => {
            const p = params as { name: string; value: number; percent: number };
            return `<strong>${p.name}</strong><br/>£${p.value.toFixed(0)} (${p.percent.toFixed(1)}%)`;
          },
        },
        series: [
          {
            type: 'pie',
            radius: ['45%', '75%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 6,
              borderColor: 'var(--bg-primary)',
              borderWidth: 2,
            },
            label: {
              color: 'var(--text-secondary)',
              fontSize: 11,
              formatter: '{b}: {d}%',
            },
            data: services.map((s, i) => ({
              value: Math.round(s.totalRevenue),
              name: s.service,
              itemStyle: {
                color: COLORS[i % COLORS.length],
              },
            })),
          },
        ],
      };
    }

    // Horizontal bar: revenue/hr ranking
    const sorted = [...services].sort((a, b) => a.revenuePerHour - b.revenuePerHour);
    return {
      tooltip: {
        formatter: (params: unknown) => {
          const p = params as { name: string; data: number };
          return `<strong>${p.name}</strong><br/>£${p.data.toFixed(0)}/hr`;
        },
      },
      grid: {
        top: 10,
        right: 20,
        bottom: 20,
        left: 10,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: 'var(--text-muted)',
          fontSize: 10,
          formatter: (v: number) => `£${v}`,
        },
        splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: sorted.map((s) => s.service),
        axisLabel: { color: 'var(--text-secondary)', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: sorted.map((s, i) => ({
            value: Math.round(s.revenuePerHour),
            itemStyle: { color: COLORS[i % COLORS.length], borderRadius: [0, 4, 4, 0] },
          })),
          barMaxWidth: 24,
        },
      ],
    };
  }, [services, mode]);

  return (
    <EChartsWrapper
      option={option}
      style={{
        height: mode === 'share' ? '320px' : `${Math.max(200, services.length * 40 + 60)}px`,
      }}
    />
  );
}

const COLORS = [
  '#6c5ce7',
  '#00cec9',
  '#fdcb6e',
  '#ff6b6b',
  '#a29bfe',
  '#55efc4',
  '#fab1a0',
  '#74b9ff',
];
