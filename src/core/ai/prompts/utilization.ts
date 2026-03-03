import type { UtilizationAnalysis } from '../../types/analysis';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function buildUtilizationPrompt(analysis: UtilizationAnalysis): string {
  const deadZoneList = analysis.deadZones
    .slice(0, 5)
    .map(
      (z) =>
        `- ${DAY_LABELS[z.day]} ${z.hour}:00 (${z.utilizationPct.toFixed(0)}% utilized, \u00A3${z.revenuePerHour.toFixed(0)}/hr)`,
    )
    .join('\n');

  const peakZoneList = analysis.peakZones
    .slice(0, 5)
    .map(
      (z) =>
        `- ${DAY_LABELS[z.day]} ${z.hour}:00 (${z.utilizationPct.toFixed(0)}% utilized, \u00A3${z.revenuePerHour.toFixed(0)}/hr)`,
    )
    .join('\n');

  return `Analyze this salon's chair utilization and recommend scheduling and pricing changes.

Overall Utilization: ${analysis.overallUtilization.toFixed(1)}%

Dead Zones (${analysis.deadZones.length} slots under 25%):
${deadZoneList || '- None'}

Peak Zones (${analysis.peakZones.length} slots over 80%):
${peakZoneList || '- None'}

Provide 2-3 specific recommendations to fill dead zones and optimize peak hours.`;
}
