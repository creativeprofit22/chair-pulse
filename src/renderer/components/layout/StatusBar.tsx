import { useDataStore } from '../../stores/data-store';

export default function StatusBar() {
  const { importStatus, rowCount, importFile } = useDataStore();

  let statusText = 'No data imported';
  if (importStatus === 'importing') {
    statusText = 'Importing...';
  } else if (importStatus === 'mapping') {
    statusText = 'Mapping columns...';
  } else if (importStatus === 'ready' && importFile) {
    statusText = `${importFile.name} — ${rowCount.toLocaleString()} bookings`;
  } else if (importStatus === 'error') {
    statusText = 'Import error';
  }

  return (
    <footer
      style={{
        height: 'var(--statusbar-height)',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        flexShrink: 0,
      }}
    >
      <span>{statusText}</span>
      <span>
        Built by{' '}
        <a
          href="https://wearedouro.agency"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          Douro Digital
        </a>
      </span>
    </footer>
  );
}
