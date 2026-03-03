import type { FullAnalysisReport } from '../../types/analysis';

export function buildActionPlanPrompt(report: FullAnalysisReport): string {
  const { health, noShow, utilization, revenue, pricing } = report;

  const existingActions = health.topActions
    .map(
      (a) =>
        `- [${a.priority.toUpperCase()}] ${a.title}: ${a.description} (est. +\u00A3${a.estimatedImpact.toFixed(0)})`,
    )
    .join('\n');

  return `Create a prioritized 5-step action plan for this salon based on all analysis data.

Health Score: ${health.overall}/100
- No-Show Rate: ${(noShow.noShowRate * 100).toFixed(1)}% (\u00A3${noShow.revenueLost.toFixed(0)} lost)
- Chair Utilization: ${utilization.overallUtilization.toFixed(1)}%
- Revenue/hr: \u00A3${revenue.avgPerHour.toFixed(0)}
- Dead zones: ${utilization.deadZones.length} time slots under 25%
- Revenue trend: ${revenue.trendDirection}
- Pricing model potential: ${pricing.revenueImpact >= 0 ? '+' : ''}\u00A3${pricing.revenueImpact.toFixed(0)}

Data-identified actions:
${existingActions || '- None identified'}

Create exactly 5 recommendations, combining the most impactful no-show, utilization, service mix, and pricing changes. Estimate total combined monetary impact. Each recommendation should be something the owner can start THIS WEEK.`;
}
