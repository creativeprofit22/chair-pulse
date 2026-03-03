interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: string;
}

export default function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <div
      style={{
        padding: '16px 20px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        flex: '1 1 180px',
        minWidth: '180px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
            }}
          >
            {value}
          </div>
          {trend && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 500,
                marginTop: '4px',
                color:
                  trend.direction === 'up'
                    ? 'var(--success)'
                    : trend.direction === 'down'
                      ? 'var(--danger)'
                      : 'var(--warning)',
              }}
            >
              <span>
                {trend.direction === 'up'
                  ? '\u25B2'
                  : trend.direction === 'down'
                    ? '\u25BC'
                    : '\u25CF'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {trend.direction !== 'neutral' && (trend.value > 0 ? '+' : '')}
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            style={{
              fontSize: '24px',
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-muted)',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
