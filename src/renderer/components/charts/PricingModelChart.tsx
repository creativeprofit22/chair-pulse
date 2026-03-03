import { useMemo } from 'react';
import EChartsWrapper from './EChartsWrapper';
import type { ECOption } from './echarts-setup';
import type { PricingSlot } from '../../../core/types/analysis';

interface PricingModelChartProps {
  slots: PricingSlot[];
}

export default function PricingModelChart({ slots }: PricingModelChartProps) {
  const option = useMemo((): ECOption => {
    const labels = slots.map((s) => s.label);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = params as { name: string; seriesName: string; data: number }[];
          const label = p[0]?.name ?? '';
          const slot = slots.find((s) => s.label === label);
          let html = `<strong>${label}</strong>`;
          html += `<br/>Utilization: ${(slot?.utilizationPct ?? 0).toFixed(0)}%`;
          for (const item of p) {
            html += `<br/>${item.seriesName}: £${item.data.toFixed(0)}`;
          }
          return html;
        },
      },
      legend: {
        data: ['Current', 'Suggested'],
        textStyle: { color: 'var(--text-muted)', fontSize: 11 },
        top: 0,
      },
      grid: {
        top: 35,
        right: 20,
        bottom: 20,
        left: 10,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: 'var(--text-muted)', fontSize: 11 },
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
          name: 'Current',
          type: 'bar',
          data: slots.map((s) => Math.round(s.currentRevenue)),
          itemStyle: { color: '#6c5ce7', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 40,
          barGap: '20%',
        },
        {
          name: 'Suggested',
          type: 'bar',
          data: slots.map((s) => Math.round(s.suggestedRevenue)),
          itemStyle: { color: '#00cec9', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 40,
        },
      ],
    };
  }, [slots]);

  return <EChartsWrapper option={option} style={{ height: '300px' }} />;
}
