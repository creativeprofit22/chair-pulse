import type { AIProvider, AIAdvice, AIInsightsReport, ChatMessage } from '../types/ai';
import type { FullAnalysisReport } from '../types/analysis';
import { SYSTEM_PROMPT } from './prompts/system';
import { buildNoShowPrompt } from './prompts/no-show';
import { buildUtilizationPrompt } from './prompts/utilization';
import { buildRevenuePrompt } from './prompts/revenue';
import { buildActionPlanPrompt } from './prompts/action-plan';

interface ParsedRecommendation {
  title?: unknown;
  description?: unknown;
  category?: unknown;
  estimatedImpact?: unknown;
  urgency?: unknown;
}

function parseAdvice(content: string): AIAdvice {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        summary?: unknown;
        recommendations?: unknown;
      };
      const recs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];

      return {
        summary: typeof parsed.summary === 'string' ? parsed.summary : content.slice(0, 200),
        recommendations: recs.map((r: ParsedRecommendation) => ({
          title: String(r.title ?? 'Recommendation'),
          description: String(r.description ?? ''),
          category: String(r.category ?? 'general'),
          estimatedImpact: Number(r.estimatedImpact) || 0,
          urgency: isValidUrgency(r.urgency) ? r.urgency : 'medium',
        })),
      };
    }
  } catch {
    // Fall through to text fallback
  }

  return {
    summary: content.slice(0, 300),
    recommendations: [
      {
        title: 'AI Recommendation',
        description: content.slice(0, 500),
        category: 'general',
        estimatedImpact: 0,
        urgency: 'medium' as const,
      },
    ],
  };
}

function isValidUrgency(v: unknown): v is 'high' | 'medium' | 'low' {
  return v === 'high' || v === 'medium' || v === 'low';
}

async function askAdvisor(provider: AIProvider, userPrompt: string): Promise<AIAdvice> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const response = await provider.chat({ messages, maxTokens: 1024, temperature: 0.3 });
  return parseAdvice(response.content);
}

export async function generateInsights(
  provider: AIProvider,
  report: FullAnalysisReport,
): Promise<AIInsightsReport> {
  const [noShowAdvice, utilizationAdvice, revenueAdvice, actionPlan] = await Promise.all([
    askAdvisor(provider, buildNoShowPrompt(report.noShow)),
    askAdvisor(provider, buildUtilizationPrompt(report.utilization)),
    askAdvisor(provider, buildRevenuePrompt(report.revenue, report.serviceMix)),
    askAdvisor(provider, buildActionPlanPrompt(report)),
  ]);

  return {
    noShowAdvice,
    utilizationAdvice,
    revenueAdvice,
    actionPlan,
    generatedAt: new Date(),
  };
}
