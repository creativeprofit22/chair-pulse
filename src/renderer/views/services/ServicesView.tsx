import { useState } from 'react';
import { useAnalysisStore } from '../../stores/analysis-store';
import StatCard from '../../components/shared/StatCard';
import PeriodSelector from '../../components/shared/PeriodSelector';
import ServiceMixChart from '../../components/charts/ServiceMixChart';
import ExportButton from '../../components/shared/ExportButton';
import PricingModelChart from '../../components/charts/PricingModelChart';
import DataTable from '../../components/shared/DataTable';
import type { ServiceMixEntry } from '../../../core/types/analysis';

export default function ServicesView() {
  const report = useAnalysisStore((s) => s.report);
  const [chartMode, setChartMode] = useState<'ranking' | 'share'>('ranking');

  if (!report) {
    return (
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '60px' }}>
        Run analysis to see service mix data.
      </div>
    );
  }

  const { serviceMix, pricing, revenue } = report;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Service Mix</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ExportButton />
          <PeriodSelector />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <StatCard label="Services" value={serviceMix.totalServices} icon={'\uD83D\uDC87'} />
        <StatCard
          label="Total Revenue"
          value={`\u00A3${revenue.total.toFixed(0)}`}
          icon={'\uD83D\uDCB0'}
        />
        <StatCard
          label="Avg / Booking"
          value={`\u00A3${revenue.avgPerBooking.toFixed(0)}`}
          icon={'\uD83D\uDCB7'}
        />
        <StatCard
          label="Best \u00A3/hr"
          value={
            serviceMix.services.length > 0
              ? `\u00A3${serviceMix.services[0].revenuePerHour.toFixed(0)}`
              : '\u2014'
          }
          icon={'\u2B50'}
        />
      </div>

      {/* Chart + Table Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Service Mix Chart */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              {chartMode === 'ranking' ? 'Revenue per Hour Ranking' : 'Revenue Share'}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '2px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px',
              }}
            >
              <button
                onClick={() => setChartMode('ranking')}
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: chartMode === 'ranking' ? 600 : 400,
                  color: chartMode === 'ranking' ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: chartMode === 'ranking' ? 'var(--bg-secondary)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Ranking
              </button>
              <button
                onClick={() => setChartMode('share')}
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: chartMode === 'share' ? 600 : 400,
                  color: chartMode === 'share' ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: chartMode === 'share' ? 'var(--bg-secondary)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Share
              </button>
            </div>
          </div>
          <ServiceMixChart services={serviceMix.services} mode={chartMode} />
        </div>

        {/* Revenue/hr Ranking Table */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            Service Revenue Details
          </div>
          <DataTable<ServiceMixEntry>
            columns={serviceColumns}
            data={serviceMix.services}
            keyFn={(row) => row.service}
          />
        </div>
      </div>

      {/* Pricing Model */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Peak / Off-Peak Pricing Model</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {pricing.offPeakDiscount * 100}% off-peak discount, {pricing.peakPremium * 100}% peak
              premium
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Projected Impact</div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: pricing.revenueImpact >= 0 ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {pricing.revenueImpact >= 0 ? '+' : ''}
              {'\u00A3'}
              {Math.round(pricing.revenueImpact).toLocaleString()}
            </div>
          </div>
        </div>
        <PricingModelChart slots={pricing.slots} />
      </div>
    </div>
  );
}

const serviceColumns = [
  {
    key: 'service',
    label: 'Service',
    render: (row: ServiceMixEntry) => row.service,
    sortValue: (row: ServiceMixEntry) => row.service,
  },
  {
    key: 'bookings',
    label: 'Bookings',
    render: (row: ServiceMixEntry) => String(row.bookingCount),
    sortValue: (row: ServiceMixEntry) => row.bookingCount,
    align: 'right' as const,
  },
  {
    key: 'revenue',
    label: 'Revenue',
    render: (row: ServiceMixEntry) => `\u00A3${row.totalRevenue.toFixed(0)}`,
    sortValue: (row: ServiceMixEntry) => row.totalRevenue,
    align: 'right' as const,
  },
  {
    key: 'duration',
    label: 'Avg Duration',
    render: (row: ServiceMixEntry) => `${row.avgDurationMins.toFixed(0)} min`,
    sortValue: (row: ServiceMixEntry) => row.avgDurationMins,
    align: 'right' as const,
  },
  {
    key: 'revenuePerHour',
    label: '\u00A3/hr',
    render: (row: ServiceMixEntry) => `\u00A3${row.revenuePerHour.toFixed(0)}`,
    sortValue: (row: ServiceMixEntry) => row.revenuePerHour,
    align: 'right' as const,
  },
  {
    key: 'share',
    label: 'Share',
    render: (row: ServiceMixEntry) => `${row.revenueSharePct.toFixed(1)}%`,
    sortValue: (row: ServiceMixEntry) => row.revenueSharePct,
    align: 'right' as const,
  },
];
