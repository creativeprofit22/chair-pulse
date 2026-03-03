import { useMemo } from 'react';
import EChartsWrapper from './EChartsWrapper';
import type { ECOption } from './echarts-setup';
import type { NoShowBreakdown as NoShowBreakdownData } from '../../../core/types/analysis';

interface NoShowBreakdownProps {
  data: NoShowBreakdownData[];
  title: string;
}

export default function NoShowBreakdown({ data, title }: NoShowBreakdownProps) {
  const option = useMemo((): ECOption => {
    const labels = data.map((d) => d.label);
    const rates = data.map((d) => +(d.rate * 100).toFixed(1));
    const revenue = data.map((d) => Math.round(d.revenueImpact));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = params as { name: string; data: number; seriesName: string }[];
          const label = p[0]?.name ?? '';
          return p.reduce((html, item) => {
            const unit = item.seriesName === 'Rate' ? '%' : '';
            const prefix = item.seriesName === 'Revenue Lost' ? '£' : '';
            return html + `<br/>${item.seriesName}: ${prefix}${item.data}${unit}`;
          }, `<strong>${label}</strong>`);
        },
      },
      legend: {
        data: ['Rate', 'Revenue Lost'],
        textStyle: { color: 'var(--text-muted)', fontSize: 11 },
        top: 0,
      },
      grid: {
        top: 30,
        right: 50,
        bottom: 20,
        left: 10,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          color: 'var(--text-muted)',
          fontSize: 11,
          rotate: labels.length > 5 ? 30 : 0,
        },
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Rate %',
          nameTextStyle: { color: 'var(--text-muted)', fontSize: 10 },
          axisLabel: {
            color: 'var(--text-muted)',
            fontSize: 10,
            formatter: (v: number) => `${v}%`,
          },
          splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' } },
        },
        {
          type: 'value',
          name: '£ Lost',
          nameTextStyle: { color: 'var(--text-muted)', fontSize: 10 },
          axisLabel: {
            color: 'var(--text-muted)',
            fontSize: 10,
            formatter: (v: number) => `£${v}`,
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Rate',
          type: 'bar',
          data: rates,
          itemStyle: { color: '#ff6b6b', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 30,
        },
        {
          name: 'Revenue Lost',
          type: 'bar',
          yAxisIndex: 1,
          data: revenue,
          itemStyle: { color: 'rgba(255, 107, 107, 0.3)', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 30,
        },
      ],
    };
  }, [data]);

  return (
    <div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: '8px',
        }}
      >
        {title}
      </div>
      <EChartsWrapper option={option} style={{ height: '280px' }} />
    </div>
  );
}
