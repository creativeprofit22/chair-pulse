import type { BookingRow, DataQualityReport } from '../../../core/types/booking';
import { useAnalysis } from '../../hooks/use-analysis';
import { useUIStore } from '../../stores/ui-store';

interface DataPreviewProps {
  data: BookingRow[];
  qualityReport: DataQualityReport | null;
}

export default function DataPreview({ data, qualityReport }: DataPreviewProps) {
  const { status, progress, runAnalysis } = useAnalysis();
  const setActiveView = useUIStore((s) => s.setActiveView);

  const handleRunAnalysis = async () => {
    await runAnalysis();
    setActiveView('dashboard');
  };

  const isRunning = status === 'running';
  const previewRows = data.slice(0, 20);

  return (
    <div>
      {qualityReport && (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <QualityStat label="Total Rows" value={qualityReport.totalRows} />
          <QualityStat label="Valid" value={qualityReport.validRows} color="var(--success)" />
          <QualityStat
            label="Invalid"
            value={qualityReport.invalidRows}
            color={qualityReport.invalidRows > 0 ? 'var(--danger)' : 'var(--text-muted)'}
          />
          {qualityReport.warnings.length > 0 && (
            <QualityStat
              label="Warnings"
              value={qualityReport.warnings.length}
              color="var(--warning)"
            />
          )}
        </div>
      )}

      <div
        style={{
          overflowX: 'auto',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
          }}
        >
          <thead>
            <tr>
              {['Date', 'Time', 'Service', 'Duration', 'Price', 'Status', 'Staff'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    borderBottom: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i}>
                <td style={cellStyle}>{row.date.toLocaleDateString()}</td>
                <td style={cellStyle}>{row.time}</td>
                <td style={cellStyle}>{row.service}</td>
                <td style={cellStyle}>{row.duration} min</td>
                <td style={cellStyle}>{formatPrice(row.price)}</td>
                <td style={cellStyle}>
                  <StatusBadge status={row.status} />
                </td>
                <td style={cellStyle}>{row.staff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > 20 && (
        <div
          style={{
            textAlign: 'center',
            padding: '8px',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          Showing 20 of {data.length} rows
        </div>
      )}

      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        {isRunning && (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Analysing... {progress}%
          </div>
        )}
        <button
          disabled={data.length === 0 || isRunning}
          onClick={handleRunAnalysis}
          style={{
            padding: '10px 24px',
            background: 'var(--accent)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 600,
            opacity: data.length === 0 || isRunning ? 0.5 : 1,
            cursor: data.length === 0 || isRunning ? 'not-allowed' : 'pointer',
          }}
        >
          {isRunning ? 'Analysing...' : 'Run Analysis'}
        </button>
      </div>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
};

function formatPrice(price: number): string {
  return `£${price.toFixed(2)}`;
}

function QualityStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div
      style={{
        padding: '8px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: color ?? 'var(--text-primary)' }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'var(--success)',
    no_show: 'var(--danger)',
    cancelled: 'var(--warning)',
    rescheduled: 'var(--text-muted)',
  };

  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px',
        fontWeight: 500,
        color: colors[status] ?? 'var(--text-secondary)',
        background: `${colors[status] ?? 'var(--text-secondary)'}20`,
      }}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
