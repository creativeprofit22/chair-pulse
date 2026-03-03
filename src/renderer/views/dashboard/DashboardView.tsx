import { useAnalysisStore } from '../../stores/analysis-store';
import { useDataStore } from '../../stores/data-store';
import { useUIStore } from '../../stores/ui-store';
import StatCard from '../../components/shared/StatCard';
import HealthGauge from '../../components/shared/HealthGauge';
import PeriodSelector from '../../components/shared/PeriodSelector';
import ExportButton from '../../components/shared/ExportButton';

export default function DashboardView() {
  const hasData = useDataStore((s) => s.importStatus === 'ready');
  const report = useAnalysisStore((s) => s.report);

  if (!hasData || !report) {
    return <PlaceholderMessage />;
  }

  const { health, noShow, utilization, revenue } = report;

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
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ExportButton />
          <PeriodSelector />
        </div>
      </div>

      {/* Health Score + KPIs Row */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          marginBottom: '24px',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Health Score
          </div>
          <HealthGauge score={health.overall} />
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            {health.subScores.map((sub) => (
              <div key={sub.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {sub.score}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {sub.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <StatCard
            label="Total Bookings"
            value={report.bookingCount.toLocaleString()}
            icon={'\uD83D\uDCC5'}
          />
          <StatCard
            label="No-Show Rate"
            value={`${(noShow.noShowRate * 100).toFixed(1)}%`}
            trend={{
              value: +(noShow.noShowRate * 100).toFixed(1),
              direction:
                noShow.noShowRate > 0.1 ? 'down' : noShow.noShowRate > 0.05 ? 'neutral' : 'up',
            }}
            icon={'\uD83D\uDEAB'}
          />
          <StatCard
            label="Utilization"
            value={`${utilization.overallUtilization.toFixed(1)}%`}
            trend={{
              value: +utilization.overallUtilization.toFixed(1),
              direction:
                utilization.overallUtilization > 65
                  ? 'up'
                  : utilization.overallUtilization > 40
                    ? 'neutral'
                    : 'down',
            }}
            icon={'\uD83D\uDCC8'}
          />
          <StatCard
            label="Revenue / Hour"
            value={`\u00A3${revenue.avgPerHour.toFixed(0)}`}
            trend={{
              value:
                revenue.trendDirection === 'up' ? 5 : revenue.trendDirection === 'down' ? -5 : 0,
              direction: revenue.trendDirection === 'flat' ? 'neutral' : revenue.trendDirection,
            }}
            icon={'\uD83D\uDCB7'}
          />
        </div>
      </div>

      {/* Top 3 Actions */}
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
            marginBottom: '16px',
            color: 'var(--text-primary)',
          }}
        >
          Top Actions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {health.topActions.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              No urgent actions identified. Your salon is performing well!
            </div>
          )}
          {health.topActions.map((action, i) => (
            <ActionRow key={i} action={action} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionRow({
  action,
  index,
}: {
  action: {
    title: string;
    description: string;
    priority: string;
    estimatedImpact: number;
    category: string;
  };
  index: number;
}) {
  const setActiveView = useUIStore((s) => s.setActiveView);

  const viewMap: Record<string, 'no-shows' | 'utilization' | 'services'> = {
    no_show: 'no-shows',
    utilization: 'utilization',
    revenue: 'services',
    service_mix: 'services',
    pricing: 'services',
  };

  const priorityColor =
    action.priority === 'high'
      ? 'var(--danger)'
      : action.priority === 'medium'
        ? 'var(--warning)'
        : 'var(--text-muted)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
      }}
      onClick={() => {
        const target = viewMap[action.category];
        if (target) setActiveView(target);
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'var(--accent-muted)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{action.title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {action.description}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: priorityColor,
          }}
        >
          {action.priority}
        </span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            color: 'var(--success)',
          }}
        >
          +{'\u00A3'}
          {Math.round(action.estimatedImpact).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function PlaceholderMessage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-muted)',
        gap: '12px',
      }}
    >
      <div style={{ fontSize: '48px' }}>{'\uD83D\uDCCA'}</div>
      <div style={{ fontSize: '18px', fontWeight: 600 }}>Import data to begin</div>
      <div style={{ fontSize: '13px' }}>
        Use the Import tab to load your booking CSV and run analysis.
      </div>
    </div>
  );
}
