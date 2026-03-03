import type { RevenueAnalysis, ServiceMixAnalysis } from '../../types/analysis';

export function buildRevenuePrompt(
  revenue: RevenueAnalysis,
  serviceMix: ServiceMixAnalysis,
): string {
  const topServices = serviceMix.services
    .slice(0, 5)
    .map(
      (s) =>
        `- ${s.service}: \u00A3${s.revenuePerHour.toFixed(0)}/hr, ${s.bookingCount} bookings, ${s.revenueSharePct.toFixed(1)}% of revenue`,
    )
    .join('\n');

  const bottomServices = [...serviceMix.services]
    .reverse()
    .slice(0, 3)
    .map(
      (s) => `- ${s.service}: \u00A3${s.revenuePerHour.toFixed(0)}/hr, ${s.bookingCount} bookings`,
    )
    .join('\n');

  return `Analyze this salon's revenue and service mix, and recommend which services to promote.

Revenue Overview:
- Total revenue: \u00A3${revenue.total.toFixed(0)}
- Average per booking: \u00A3${revenue.avgPerBooking.toFixed(0)}
- Average per hour: \u00A3${revenue.avgPerHour.toFixed(0)}
- Trend: ${revenue.trendDirection}

Top services by revenue per hour:
${topServices}

Lowest revenue per hour:
${bottomServices}

Provide 2-3 specific recommendations for service promotion and pricing strategy.`;
}
