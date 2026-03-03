export default function CTABanner() {
  return (
    <div
      style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(108,92,231,0.12), rgba(0,206,201,0.08))',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--accent-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
          Want this automated for your salon?
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Douro Digital builds custom booking analytics dashboards that update in real-time.
        </div>
      </div>
      <a
        href="https://wearedouro.agency"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '8px 20px',
          background: 'var(--accent)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          textDecoration: 'none',
        }}
      >
        Learn More
      </a>
    </div>
  );
}
