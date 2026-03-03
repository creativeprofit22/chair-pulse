import type { NoShowAnalysis } from '../../types/analysis';

export function buildNoShowPrompt(analysis: NoShowAnalysis): string {
  const worstDay = [...analysis.byDayOfWeek].sort((a, b) => b.rate - a.rate)[0];
  const worstTime = [...analysis.byTimeOfDay].sort((a, b) => b.rate - a.rate)[0];
  const worstService = [...analysis.byService].sort((a, b) => b.rate - a.rate)[0];

  const depositSection =
    analysis.byDepositStatus.length > 0
      ? `\nDeposit breakdown:\n${analysis.byDepositStatus.map((d) => `- ${d.label}: ${(d.rate * 100).toFixed(1)}% no-show rate`).join('\n')}`
      : '\nNo deposit data available.';

  return `Analyze this salon's no-show data and recommend deposit policies and scheduling changes.

No-Show Overview:
- Total bookings: ${analysis.totalBookings}
- No-shows: ${analysis.noShowCount} (${(analysis.noShowRate * 100).toFixed(1)}%)
- Revenue lost to no-shows: \u00A3${analysis.revenueLost.toFixed(0)}

Worst no-show day: ${worstDay?.label ?? 'N/A'} (${((worstDay?.rate ?? 0) * 100).toFixed(1)}%, \u00A3${(worstDay?.revenueImpact ?? 0).toFixed(0)} lost)
Worst time slot: ${worstTime?.label ?? 'N/A'} (${((worstTime?.rate ?? 0) * 100).toFixed(1)}%)
Worst service: ${worstService?.label ?? 'N/A'} (${((worstService?.rate ?? 0) * 100).toFixed(1)}%)
${depositSection}

Provide 2-3 specific recommendations for reducing no-shows, focusing on deposit policies and scheduling adjustments.`;
}
