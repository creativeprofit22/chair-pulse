import { useState, useCallback } from 'react';
import { useAnalysisStore } from '../../stores/analysis-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useUIStore } from '../../stores/ui-store';
import type { AIInsightsReport } from '../../../core/types/ai';
import ActionCard from './ActionCard';
import CTABanner from '../../components/shared/CTABanner';

export default function AIInsightsView() {
  const report = useAnalysisStore((s) => s.report);
  const { aiProvider, aiEnabled } = useSettingsStore();
  const setActiveView = useUIStore((s) => s.setActiveView);

  const [insights, setInsights] = useState<AIInsightsReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!report) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await window.electronAPI.generateInsights(report);
      setInsights(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  }, [report]);

  if (!report) {
    return (
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '60px' }}>
        Run analysis to see AI insights.
      </div>
    );
  }

  // Not configured
  if (aiProvider === 'none' || !aiEnabled) {
    return (
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>AI Insights</h1>
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>{'🤖'}</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            AI Not Configured
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Set up your AI provider in Settings to get plain-English recommendations for your salon.
          </div>
          <button
            onClick={() => setActiveView('settings')}
            style={{
              padding: '10px 24px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

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
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>AI Insights</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            padding: '8px 20px',
            background: generating ? 'var(--bg-tertiary)' : 'var(--accent)',
            color: generating ? 'var(--text-muted)' : '#fff',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            opacity: generating ? 0.7 : 1,
          }}
        >
          {generating ? 'Generating...' : insights ? 'Regenerate Insights' : 'Generate Insights'}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(255, 107, 107, 0.08)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {generating && (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>{'🔄'}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Analyzing your data with AI...
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            This may take 15-30 seconds depending on your provider.
          </div>
        </div>
      )}

      {insights && !generating && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Plan Summary */}
          {insights.actionPlan.summary && (
            <div
              style={{
                padding: '16px 20px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Summary</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {insights.actionPlan.summary}
              </div>
            </div>
          )}

          {/* Action Plan Cards */}
          <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>Action Plan</div>
          {insights.actionPlan.recommendations.map((rec, i) => (
            <ActionCard key={i} recommendation={rec} index={i} />
          ))}

          {/* Sectional Advice */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '12px',
              marginTop: '8px',
            }}
          >
            <AdviceSection title="No-Show Advice" advice={insights.noShowAdvice.summary} />
            <AdviceSection title="Utilization Advice" advice={insights.utilizationAdvice.summary} />
            <AdviceSection title="Revenue Advice" advice={insights.revenueAdvice.summary} />
          </div>

          {/* CTA */}
          <div style={{ marginTop: '8px' }}>
            <CTABanner />
          </div>
        </div>
      )}

      {!insights && !generating && !error && (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>{'🤖'}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Click &quot;Generate Insights&quot; to get AI-powered recommendations for your salon.
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Your data is sent directly to your AI provider. Chair Pulse never sees it.
          </div>
        </div>
      )}
    </div>
  );
}

function AdviceSection({ title, advice }: { title: string; advice: string }) {
  if (!advice) return null;
  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          marginBottom: '8px',
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {advice}
      </div>
    </div>
  );
}
