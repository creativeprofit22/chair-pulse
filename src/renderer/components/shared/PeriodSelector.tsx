import { useAnalysisStore } from '../../stores/analysis-store';

const PERIODS = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
] as const;

export default function PeriodSelector() {
  const { selectedPeriod, setSelectedPeriod } = useAnalysisStore();

  return (
    <div
      style={{
        display: 'flex',
        gap: '2px',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)',
        padding: '2px',
      }}
    >
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => setSelectedPeriod(p.value)}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: selectedPeriod === p.value ? 600 : 400,
            color: selectedPeriod === p.value ? 'var(--text-primary)' : 'var(--text-muted)',
            background: selectedPeriod === p.value ? 'var(--bg-secondary)' : 'transparent',
            borderRadius: 'var(--radius-sm)',
            transition: 'all 0.15s ease',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
