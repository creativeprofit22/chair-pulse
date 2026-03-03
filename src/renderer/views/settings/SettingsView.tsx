import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore } from '../../stores/settings-store';

type ProviderType = 'none' | 'claude' | 'openai' | 'ollama';

const PROVIDER_OPTIONS: { value: ProviderType; label: string; needsKey: boolean }[] = [
  { value: 'none', label: 'None', needsKey: false },
  { value: 'claude', label: 'Claude (Anthropic)', needsKey: true },
  { value: 'openai', label: 'OpenAI', needsKey: true },
  { value: 'ollama', label: 'Ollama (Local)', needsKey: false },
];

const DEFAULT_MODELS: Record<string, string> = {
  claude: 'claude-haiku-4-5-20251001',
  openai: 'gpt-4o-mini',
  ollama: 'llama3.2',
};

export default function SettingsView() {
  const [version, setVersion] = useState('');
  const { aiProvider, aiModel, aiBaseUrl, save } = useSettingsStore();

  const [provider, setProvider] = useState<ProviderType>(aiProvider);
  const [model, setModel] = useState(aiModel);
  const [baseUrl, setBaseUrl] = useState(aiBaseUrl);
  const [apiKey, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setVersion);
  }, []);

  useEffect(() => {
    setProvider(aiProvider);
    setModel(aiModel || DEFAULT_MODELS[aiProvider] || '');
    setBaseUrl(aiBaseUrl);
  }, [aiProvider, aiModel, aiBaseUrl]);

  useEffect(() => {
    if (provider !== 'none') {
      window.electronAPI.hasApiKey(provider).then(setHasKey);
    } else {
      setHasKey(false);
    }
  }, [provider]);

  const handleProviderChange = useCallback((newProvider: ProviderType) => {
    setProvider(newProvider);
    setModel(DEFAULT_MODELS[newProvider] || '');
    setBaseUrl(newProvider === 'ollama' ? 'http://localhost:11434' : '');
    setApiKeyInput('');
    setTestResult(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (apiKey && provider !== 'none') {
        await window.electronAPI.setApiKey(provider, apiKey);
        setHasKey(true);
        setApiKeyInput('');
      }
      await save({
        aiProvider: provider,
        aiModel: model,
        aiBaseUrl: baseUrl,
        aiEnabled: provider !== 'none',
      });
    } finally {
      setSaving(false);
    }
  }, [provider, model, baseUrl, apiKey, save]);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await window.electronAPI.testAIConnection(provider, model, baseUrl);
      setTestResult(result);
    } catch (err) {
      setTestResult({ ok: false, error: err instanceof Error ? err.message : 'Test failed' });
    } finally {
      setTesting(false);
    }
  }, [provider, model, baseUrl]);

  const currentProviderInfo = PROVIDER_OPTIONS.find((p) => p.value === provider);

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Settings</h1>

      {/* AI Configuration */}
      <section
        style={{
          padding: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          marginBottom: '16px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>AI Provider</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Provider Select */}
          <div>
            <label style={labelStyle}>Provider</label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as ProviderType)}
              style={inputStyle}
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {provider !== 'none' && (
            <>
              {/* Model */}
              <div>
                <label style={labelStyle}>Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={DEFAULT_MODELS[provider] || 'Model name'}
                  style={inputStyle}
                />
              </div>

              {/* Base URL (optional for Claude/OpenAI, shown for Ollama) */}
              {(provider === 'ollama' || baseUrl) && (
                <div>
                  <label style={labelStyle}>Base URL</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={
                      provider === 'ollama' ? 'http://localhost:11434' : 'Leave empty for default'
                    }
                    style={inputStyle}
                  />
                </div>
              )}

              {/* API Key */}
              {currentProviderInfo?.needsKey && (
                <div>
                  <label style={labelStyle}>
                    API Key{' '}
                    {hasKey && (
                      <span style={{ color: 'var(--success)', fontWeight: 400 }}>(saved)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={hasKey ? '••••••••••••••••' : 'Enter API key'}
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleTest} disabled={testing} style={secondaryBtnStyle}>
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
              </div>

              {testResult && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    background: testResult.ok
                      ? 'rgba(0, 206, 201, 0.08)'
                      : 'rgba(255, 107, 107, 0.08)',
                    color: testResult.ok ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${testResult.ok ? 'var(--success)' : 'var(--danger)'}`,
                  }}
                >
                  {testResult.ok ? 'Connection successful!' : `Error: ${testResult.error}`}
                </div>
              )}
            </>
          )}
        </div>

        {/* Privacy Notice */}
        <div
          style={{
            marginTop: '16px',
            padding: '10px 12px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Your API key is encrypted and stored locally using your system&apos;s secure storage. AI
          calls go directly from your machine to the provider. Chair Pulse never sees your data or
          keys.
        </div>
      </section>

      {/* About */}
      <section
        style={{
          padding: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>About</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Version:</span>{' '}
            <span>{version || '...'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Author:</span> <span>Douro Digital</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>License:</span> <span>MIT</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Website:</span>{' '}
            <a
              href="https://wearedouro.agency"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              wearedouro.agency
            </a>
          </div>
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
            Your data never leaves your device. AI calls go directly from your machine to the
            provider using your own API key.
          </div>
        </div>
      </section>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: '13px',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  background: 'var(--accent)',
  color: '#fff',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px',
  fontWeight: 600,
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px',
  fontWeight: 600,
  border: '1px solid var(--border)',
};
