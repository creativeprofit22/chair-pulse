import { useSettingsStore } from '../../stores/settings-store';

interface DisclaimerProps {
  onAccept: () => void;
}

export default function Disclaimer({ onAccept }: DisclaimerProps) {
  const save = useSettingsStore((s) => s.save);

  const handleAccept = async () => {
    await save({ disclaimerAccepted: true });
    onAccept();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '32px',
          maxWidth: '480px',
          width: '90%',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
          Welcome to Chair Pulse
        </h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
            lineHeight: 1.6,
          }}
        >
          <p>
            Chair Pulse analyzes your salon booking data to help you understand no-show patterns,
            chair utilization, and revenue opportunities.
          </p>
          <p>
            <strong style={{ color: 'var(--text-primary)' }}>
              Your data stays on your device.
            </strong>{' '}
            This app never sends your booking data to any server. All analysis runs locally on your
            computer.
          </p>
          <p>
            If you choose to enable AI recommendations, calls go directly from your machine to the
            AI provider (OpenAI, Anthropic, or local Ollama) using your own API key. Douro Digital
            never sees your data or your keys.
          </p>
        </div>

        <button
          onClick={handleAccept}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--accent)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          I understand — let&apos;s go
        </button>
      </div>
    </div>
  );
}
