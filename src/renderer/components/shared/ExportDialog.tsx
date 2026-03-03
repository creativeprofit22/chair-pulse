import { useState } from 'react';
import { useAnalysisStore } from '../../stores/analysis-store';

interface ExportDialogProps {
  onClose: () => void;
  insights: unknown | null;
}

export default function ExportDialog({ onClose, insights }: ExportDialogProps) {
  const report = useAnalysisStore((s) => s.report);
  const [exporting, setExporting] = useState(false);

  if (!report) return null;

  const handleExport = async (format: 'pdf' | 'csv') => {
    setExporting(true);
    try {
      if (format === 'pdf') {
        await window.electronAPI.exportPdf(report, insights as null);
      } else {
        await window.electronAPI.exportCsv(report, insights as null);
      }
      onClose();
    } catch {
      // Dialog was cancelled or export failed
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '24px',
          width: '360px',
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Export Report</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            style={{
              padding: '14px 20px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 600,
              opacity: exporting ? 0.6 : 1,
            }}
          >
            Export as PDF
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            style={{
              padding: '14px 20px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 600,
              border: '1px solid var(--border)',
              opacity: exporting ? 0.6 : 1,
            }}
          >
            Export as CSV
          </button>
        </div>

        {insights != null && (
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            AI insights will be included in the export.
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '8px',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
