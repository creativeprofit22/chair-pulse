import type { AIRecommendation } from '../../../core/types/ai';

interface ActionCardProps {
  recommendation: AIRecommendation;
  index: number;
}

export default function ActionCard({ recommendation, index }: ActionCardProps) {
  const urgencyColor =
    recommendation.urgency === 'high'
      ? 'var(--danger)'
      : recommendation.urgency === 'medium'
        ? 'var(--warning)'
        : 'var(--text-muted)';

  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${urgencyColor}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--accent-muted)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {index + 1}
          </div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{recommendation.title}</div>
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: urgencyColor,
            }}
          >
            {recommendation.urgency}
          </span>
          {recommendation.estimatedImpact > 0 && (
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                color: 'var(--success)',
              }}
            >
              +{'\u00A3'}
              {Math.round(recommendation.estimatedImpact).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          paddingLeft: '34px',
        }}
      >
        {recommendation.description}
      </div>
      {recommendation.category && recommendation.category !== 'general' && (
        <div style={{ paddingLeft: '34px', marginTop: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            {recommendation.category.replace('_', ' ')}
          </span>
        </div>
      )}
    </div>
  );
}
