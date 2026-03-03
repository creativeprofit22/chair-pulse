import type {
  NoShowAnalysis,
  UtilizationAnalysis,
  RevenueAnalysis,
  ServiceMixAnalysis,
  HealthScore,
  HealthSubScore,
  ActionItem,
} from '../types/analysis';

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function noShowScore(rate: number): number {
  // 0% → 100, 20% → 0
  return Math.round(clamp(0, 100, 100 - rate * 500));
}

function utilizationScore(pct: number): number {
  // 0% → 0, 80%+ → 100
  return Math.round(clamp(0, 100, (pct / 80) * 100));
}

function revenueScore(direction: 'up' | 'down' | 'flat'): number {
  if (direction === 'up') return 85;
  if (direction === 'flat') return 60;
  return 35;
}

function serviceMixScore(totalServices: number): number {
  // Diversity: more services = better, cap at 6
  return Math.round(clamp(30, 100, 30 + (Math.min(totalServices, 6) / 6) * 70));
}

const WEIGHTS = {
  noShow: 0.3,
  utilization: 0.3,
  revenue: 0.2,
  serviceMix: 0.2,
};

export function calculateHealthScore(
  noShow: NoShowAnalysis,
  utilization: UtilizationAnalysis,
  revenue: RevenueAnalysis,
  serviceMix: ServiceMixAnalysis,
): HealthScore {
  const subScores: HealthSubScore[] = [
    { label: 'No-Show Rate', score: noShowScore(noShow.noShowRate), weight: WEIGHTS.noShow },
    {
      label: 'Utilization',
      score: utilizationScore(utilization.overallUtilization),
      weight: WEIGHTS.utilization,
    },
    {
      label: 'Revenue Trend',
      score: revenueScore(revenue.trendDirection),
      weight: WEIGHTS.revenue,
    },
    {
      label: 'Service Mix',
      score: serviceMixScore(serviceMix.totalServices),
      weight: WEIGHTS.serviceMix,
    },
  ];

  const overall = Math.round(subScores.reduce((sum, s) => sum + s.score * s.weight, 0));

  const actions = generateActions(noShow, utilization, revenue, serviceMix);

  return {
    overall,
    subScores,
    topActions: actions.slice(0, 3),
  };
}

function generateActions(
  noShow: NoShowAnalysis,
  utilization: UtilizationAnalysis,
  revenue: RevenueAnalysis,
  serviceMix: ServiceMixAnalysis,
): ActionItem[] {
  const actions: ActionItem[] = [];

  // No-show actions
  if (noShow.noShowRate > 0.1) {
    actions.push({
      title: 'Implement deposit policy',
      description: `No-show rate is ${(noShow.noShowRate * 100).toFixed(1)}%. Requiring deposits could recover up to £${noShow.revenueLost.toFixed(0)} in lost revenue.`,
      category: 'no_show',
      priority: 'high',
      estimatedImpact: noShow.revenueLost * 0.6,
    });
  } else if (noShow.noShowRate > 0.05) {
    actions.push({
      title: 'Send booking reminders',
      description: `No-show rate is ${(noShow.noShowRate * 100).toFixed(1)}%. Automated reminders could reduce this by 30-50%.`,
      category: 'no_show',
      priority: 'medium',
      estimatedImpact: noShow.revenueLost * 0.4,
    });
  }

  // Check deposit-specific no-show patterns
  const withoutDeposit = noShow.byDepositStatus.find((b) => b.label === 'Without Deposit');
  const withDeposit = noShow.byDepositStatus.find((b) => b.label === 'With Deposit');
  if (withoutDeposit && withDeposit && withoutDeposit.rate > withDeposit.rate * 2) {
    actions.push({
      title: 'Require deposits for high-risk slots',
      description: `No-show rate without deposit (${(withoutDeposit.rate * 100).toFixed(1)}%) is significantly higher than with deposit (${(withDeposit.rate * 100).toFixed(1)}%).`,
      category: 'no_show',
      priority: 'high',
      estimatedImpact: withoutDeposit.revenueImpact * 0.5,
    });
  }

  // Utilization actions
  if (utilization.deadZones.length > 3) {
    const deadRevenuePotential = utilization.deadZones.length * revenue.avgPerHour;
    actions.push({
      title: 'Offer off-peak promotions',
      description: `${utilization.deadZones.length} time slots have under 25% utilization. Promotions could fill these gaps.`,
      category: 'utilization',
      priority: 'medium',
      estimatedImpact: deadRevenuePotential * 0.3,
    });
  }

  if (utilization.overallUtilization < 50) {
    actions.push({
      title: 'Optimise scheduling',
      description: `Overall utilization is ${utilization.overallUtilization.toFixed(1)}%. Consolidating shifts or adjusting hours could improve efficiency.`,
      category: 'utilization',
      priority: 'medium',
      estimatedImpact: revenue.total * 0.1,
    });
  }

  // Revenue actions
  if (revenue.trendDirection === 'down') {
    actions.push({
      title: 'Investigate revenue decline',
      description:
        'Weekly revenue is trending down. Review pricing, booking volume, and service mix for changes.',
      category: 'revenue',
      priority: 'high',
      estimatedImpact: revenue.total * 0.15,
    });
  }

  // Service mix actions
  if (serviceMix.services.length >= 2) {
    const topService = serviceMix.services[0];
    const bottomService = serviceMix.services[serviceMix.services.length - 1];
    if (topService.revenuePerHour > bottomService.revenuePerHour * 2) {
      actions.push({
        title: `Promote ${topService.service}`,
        description: `${topService.service} earns £${topService.revenuePerHour.toFixed(0)}/hr vs £${bottomService.revenuePerHour.toFixed(0)}/hr for ${bottomService.service}. Shift marketing to higher-value services.`,
        category: 'service_mix',
        priority: 'medium',
        estimatedImpact: topService.revenuePerHour * 4,
      });
    }
  }

  // Sort by estimated impact descending
  actions.sort((a, b) => b.estimatedImpact - a.estimatedImpact);

  return actions;
}
