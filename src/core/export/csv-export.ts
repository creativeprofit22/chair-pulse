import type { FullAnalysisReport } from '../types/analysis';
import type { AIInsightsReport } from '../types/ai';

function escapeCsvValue(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(values: (string | number)[]): string {
  return values.map(escapeCsvValue).join(',');
}

export function generateCsvExport(report: FullAnalysisReport, insights?: AIInsightsReport): string {
  const sections: string[] = [];

  // Overview
  sections.push('=== Overview ===');
  sections.push(toCsvRow(['Metric', 'Value']));
  sections.push(toCsvRow(['Total Bookings', report.bookingCount]));
  sections.push(toCsvRow(['Health Score', report.health.overall]));
  sections.push(toCsvRow(['No-Show Rate', `${(report.noShow.noShowRate * 100).toFixed(1)}%`]));
  sections.push(
    toCsvRow(['Revenue Lost (No-Shows)', `\u00A3${report.noShow.revenueLost.toFixed(0)}`]),
  );
  sections.push(
    toCsvRow(['Chair Utilization', `${report.utilization.overallUtilization.toFixed(1)}%`]),
  );
  sections.push(toCsvRow(['Total Revenue', `\u00A3${report.revenue.total.toFixed(0)}`]));
  sections.push(toCsvRow(['Avg Revenue/Hour', `\u00A3${report.revenue.avgPerHour.toFixed(0)}`]));
  sections.push('');

  // No-Show Breakdown
  sections.push('=== No-Show Breakdown by Day ===');
  sections.push(toCsvRow(['Day', 'Count', 'Rate', 'Revenue Impact']));
  for (const d of report.noShow.byDayOfWeek) {
    sections.push(
      toCsvRow([
        d.label,
        d.count,
        `${(d.rate * 100).toFixed(1)}%`,
        `\u00A3${d.revenueImpact.toFixed(0)}`,
      ]),
    );
  }
  sections.push('');

  // No-Show by Time
  sections.push('=== No-Show Breakdown by Time ===');
  sections.push(toCsvRow(['Time', 'Count', 'Rate', 'Revenue Impact']));
  for (const d of report.noShow.byTimeOfDay) {
    sections.push(
      toCsvRow([
        d.label,
        d.count,
        `${(d.rate * 100).toFixed(1)}%`,
        `\u00A3${d.revenueImpact.toFixed(0)}`,
      ]),
    );
  }
  sections.push('');

  // Service Mix
  sections.push('=== Service Mix ===');
  sections.push(toCsvRow(['Service', 'Bookings', 'Revenue', 'Avg Duration', '\u00A3/hr', 'Share']));
  for (const s of report.serviceMix.services) {
    sections.push(
      toCsvRow([
        s.service,
        s.bookingCount,
        `\u00A3${s.totalRevenue.toFixed(0)}`,
        `${s.avgDurationMins.toFixed(0)} min`,
        `\u00A3${s.revenuePerHour.toFixed(0)}`,
        `${s.revenueSharePct.toFixed(1)}%`,
      ]),
    );
  }
  sections.push('');

  // Pricing Model
  sections.push('=== Pricing Model ===');
  sections.push(toCsvRow(['Slot', 'Current Revenue', 'Suggested Revenue', 'Peak', 'Utilization']));
  for (const p of report.pricing.slots) {
    sections.push(
      toCsvRow([
        p.label,
        `\u00A3${p.currentRevenue.toFixed(0)}`,
        `\u00A3${p.suggestedRevenue.toFixed(0)}`,
        p.isPeak ? 'Yes' : 'No',
        `${p.utilizationPct.toFixed(0)}%`,
      ]),
    );
  }
  sections.push('');

  // Top Actions
  sections.push('=== Top Actions ===');
  sections.push(toCsvRow(['Priority', 'Title', 'Description', 'Est. Impact']));
  for (const a of report.health.topActions) {
    sections.push(
      toCsvRow([a.priority, a.title, a.description, `\u00A3${a.estimatedImpact.toFixed(0)}`]),
    );
  }
  sections.push('');

  // AI Insights
  if (insights) {
    sections.push('=== AI Action Plan ===');
    sections.push(toCsvRow(['Urgency', 'Title', 'Description', 'Est. Impact']));
    for (const r of insights.actionPlan.recommendations) {
      sections.push(toCsvRow([r.urgency, r.title, r.description, `\u00A3${r.estimatedImpact}`]));
    }
    sections.push('');
  }

  return sections.join('\n');
}
