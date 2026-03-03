import { useAnalysisStore } from '../../stores/analysis-store';
import StatCard from '../../components/shared/StatCard';
import PeriodSelector from '../../components/shared/PeriodSelector';
import UtilizationHeatmap from '../../components/charts/UtilizationHeatmap';
import DataTable from '../../components/shared/DataTable';
import ExportButton from '../../components/shared/ExportButton';
import type { UtilizationCell } from '../../../core/types/analysis';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function UtilizationView() {
  const report = useAnalysisStore((s) => s.report);

  if (!report) {
    return (
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '60px' }}>
        Run analysis to see utilization data.
      </div>
    );
  }

  const { utilization, revenue } = report;

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
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Chair Utilization</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ExportButton />
          <PeriodSelector />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <StatCard
          label="Overall Utilization"
          value={`${utilization.overallUtilization.toFixed(1)}%`}
          icon={'\uD83D\uDCC8'}
        />
        <StatCard label="Dead Zones" value={utilization.deadZones.length} icon={'\u26A0\uFE0F'} />
        <StatCard label="Peak Zones" value={utilization.peakZones.length} icon={'\uD83D\uDD25'} />
        <StatCard
          label="Avg Revenue/hr"
          value={`\u00A3${revenue.avgPerHour.toFixed(0)}`}
          icon={'\uD83D\uDCB7'}
        />
      </div>

      {/* Heatmap */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          Weekly Utilization Heatmap
        </div>
        <UtilizationHeatmap data={utilization} />
      </div>

      {/* Dead / Peak Zones */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '16px',
        }}
      >
        {utilization.deadZones.length > 0 && (
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
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '12px',
                color: 'var(--warning)',
              }}
            >
              Dead Zones (&lt;25% utilization)
            </div>
            <DataTable<UtilizationCell>
              columns={cellColumns}
              data={utilization.deadZones}
              keyFn={(row) => `${row.day}-${row.hour}`}
            />
          </div>
        )}

        {utilization.peakZones.length > 0 && (
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
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '12px',
                color: 'var(--success)',
              }}
            >
              Peak Zones (&gt;80% utilization)
            </div>
            <DataTable<UtilizationCell>
              columns={cellColumns}
              data={utilization.peakZones}
              keyFn={(row) => `${row.day}-${row.hour}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const cellColumns = [
  {
    key: 'slot',
    label: 'Slot',
    render: (row: UtilizationCell) => `${DAY_LABELS[row.day]} ${row.hour}:00`,
    sortValue: (row: UtilizationCell) => row.day * 24 + row.hour,
  },
  {
    key: 'utilization',
    label: 'Utilization',
    render: (row: UtilizationCell) => `${row.utilizationPct.toFixed(0)}%`,
    sortValue: (row: UtilizationCell) => row.utilizationPct,
    align: 'right' as const,
  },
  {
    key: 'bookings',
    label: 'Bookings',
    render: (row: UtilizationCell) => String(row.bookingCount),
    sortValue: (row: UtilizationCell) => row.bookingCount,
    align: 'right' as const,
  },
  {
    key: 'revenuePerHour',
    label: '\u00A3/hr',
    render: (row: UtilizationCell) => `\u00A3${row.revenuePerHour.toFixed(0)}`,
    sortValue: (row: UtilizationCell) => row.revenuePerHour,
    align: 'right' as const,
  },
];
