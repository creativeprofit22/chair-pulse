import { useState } from 'react';
import ExportDialog from './ExportDialog';

interface ExportButtonProps {
  insights?: unknown | null;
}

export default function ExportButton({ insights = null }: ExportButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        style={{
          padding: '6px 14px',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          fontWeight: 500,
          border: '1px solid var(--border)',
        }}
      >
        Export
      </button>
      {showDialog && <ExportDialog onClose={() => setShowDialog(false)} insights={insights} />}
    </>
  );
}
