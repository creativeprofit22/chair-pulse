import { useAnalysisStore } from '../../stores/analysis-store';
import StatCard from '../../components/shared/StatCard';
import PeriodSelector from '../../components/shared/PeriodSelector';
import NoShowBreakdown from '../../components/charts/NoShowBreakdown';
import ExportButton from '../../components/shared/ExportButton';

export default function NoShowsView() {
  const report = useAnalysisStore((s) => s.report);

  if (!report) {
    return (
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '60px' }}>
        Run analysis to see no-show insights.
      </div>
    );
  }

  const { noShow } = report;

  // Find the worst day and time
  const worstDay = [...noShow.byDayOfWeek].sort((a, b) => b.rate - a.rate)[0];
  const worstTime = [...noShow.byTimeOfDay].sort((a, b) => b.rate - a.rate)[0];

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
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>No-Show Analysis</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ExportButton />
          <PeriodSelector />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <StatCard
          label="No-Show Rate"
          value={`${(noShow.noShowRate * 100).toFixed(1)}%`}
          icon={'\uD83D\uDEAB'}
        />
        <StatCard
          label="Revenue Lost"
          value={`\u00A3${noShow.revenueLost.toFixed(0)}`}
          icon={'\uD83D\uDCB8'}
        />
        <StatCard
          label="No-Shows"
          value={`${noShow.noShowCount} / ${noShow.totalBookings}`}
          icon={'\uD83D\uDCC9'}
        />
      </div>

      {/* Insight callouts */}
      {(worstDay || worstTime) && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {worstDay && worstDay.rate > 0 && (
            <InsightBox
              title="Worst Day"
              text={`${worstDay.label} has a ${(worstDay.rate * 100).toFixed(1)}% no-show rate, costing \u00A3${worstDay.revenueImpact.toFixed(0)} in lost revenue.`}
            />
          )}
          {worstTime && worstTime.rate > 0 && (
            <InsightBox
              title="Worst Time"
              text={`${worstTime.label} slots have a ${(worstTime.rate * 100).toFixed(1)}% no-show rate. Consider requiring deposits for these slots.`}
            />
          )}
        </div>
      )}

      {/* Breakdown Charts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '16px',
        }}
      >
        <ChartPanel>
          <NoShowBreakdown data={noShow.byDayOfWeek} title="By Day of Week" />
        </ChartPanel>
        <ChartPanel>
          <NoShowBreakdown data={noShow.byTimeOfDay} title="By Time of Day" />
        </ChartPanel>
        <ChartPanel>
          <NoShowBreakdown data={noShow.byService} title="By Service" />
        </ChartPanel>
        <ChartPanel>
          <NoShowBreakdown data={noShow.byStaff} title="By Staff" />
        </ChartPanel>
        {noShow.byDepositStatus.length > 0 && (
          <ChartPanel>
            <NoShowBreakdown data={noShow.byDepositStatus} title="By Deposit Status" />
          </ChartPanel>
        )}
      </div>
    </div>
  );
}

function ChartPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        padding: '16px',
      }}
    >
      {children}
    </div>
  );
}

function InsightBox({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        flex: '1 1 300px',
        padding: '14px 16px',
        background: 'rgba(255, 107, 107, 0.08)',
        borderRadius: 'var(--radius-md)',
        borderLeft: '3px solid var(--danger)',
      }}
    >
      <div
        style={{ fontSize: '12px', fontWeight: 600, color: 'var(--danger)', marginBottom: '4px' }}
      >
        {title}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {text}
      </div>
    </div>
  );
}
