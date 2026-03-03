import { describe, it, expect } from 'vitest';
import { calculateHealthScore } from '../../../../src/core/analyzers/health-score';
import type {
  NoShowAnalysis,
  UtilizationAnalysis,
  RevenueAnalysis,
  ServiceMixAnalysis,
} from '../../../../src/core/types/analysis';

function makeNoShow(overrides: Partial<NoShowAnalysis> = {}): NoShowAnalysis {
  return {
    totalBookings: 100,
    noShowCount: 10,
    noShowRate: 0.1,
    revenueLost: 250,
    byDayOfWeek: [],
    byTimeOfDay: [],
    byService: [],
    byStaff: [],
    byDepositStatus: [
      { label: 'With Deposit', count: 0, rate: 0, revenueImpact: 0 },
      { label: 'Without Deposit', count: 10, rate: 0.12, revenueImpact: 250 },
    ],
    ...overrides,
  };
}

function makeUtilization(overrides: Partial<UtilizationAnalysis> = {}): UtilizationAnalysis {
  return {
    cells: [],
    overallUtilization: 60,
    deadZones: [],
    peakZones: [],
    operatingHours: {},
    ...overrides,
  };
}

function makeRevenue(overrides: Partial<RevenueAnalysis> = {}): RevenueAnalysis {
  return {
    total: 5000,
    avgPerBooking: 50,
    avgPerHour: 40,
    byDayOfWeek: [],
    byTimeSlot: [],
    weeklyTrend: [],
    trendDirection: 'flat',
    ...overrides,
  };
}

function makeServiceMix(overrides: Partial<ServiceMixAnalysis> = {}): ServiceMixAnalysis {
  return {
    services: [
      {
        service: 'Haircut',
        bookingCount: 40,
        totalRevenue: 1000,
        avgDurationMins: 30,
        revenuePerHour: 50,
        revenueSharePct: 40,
      },
      {
        service: 'Colour',
        bookingCount: 20,
        totalRevenue: 1500,
        avgDurationMins: 90,
        revenuePerHour: 42.5,
        revenueSharePct: 60,
      },
    ],
    totalServices: 2,
    ...overrides,
  };
}

describe('calculateHealthScore', () => {
  it('returns overall score between 0 and 100', () => {
    const result = calculateHealthScore(
      makeNoShow(),
      makeUtilization(),
      makeRevenue(),
      makeServiceMix(),
    );

    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it('returns 4 sub-scores', () => {
    const result = calculateHealthScore(
      makeNoShow(),
      makeUtilization(),
      makeRevenue(),
      makeServiceMix(),
    );

    expect(result.subScores).toHaveLength(4);
    expect(result.subScores.map((s) => s.label)).toEqual([
      'No-Show Rate',
      'Utilization',
      'Revenue Trend',
      'Service Mix',
    ]);
  });

  it('sub-score weights sum to 1', () => {
    const result = calculateHealthScore(
      makeNoShow(),
      makeUtilization(),
      makeRevenue(),
      makeServiceMix(),
    );

    const totalWeight = result.subScores.reduce((sum, s) => sum + s.weight, 0);
    expect(totalWeight).toBeCloseTo(1);
  });

  it('higher no-show rate lowers score', () => {
    const good = calculateHealthScore(
      makeNoShow({ noShowRate: 0.02 }),
      makeUtilization(),
      makeRevenue(),
      makeServiceMix(),
    );
    const bad = calculateHealthScore(
      makeNoShow({ noShowRate: 0.2 }),
      makeUtilization(),
      makeRevenue(),
      makeServiceMix(),
    );

    expect(good.overall).toBeGreaterThan(bad.overall);
  });

  it('higher utilization raises score', () => {
    const good = calculateHealthScore(
      makeNoShow(),
      makeUtilization({ overallUtilization: 80 }),
      makeRevenue(),
      makeServiceMix(),
    );
    const bad = calculateHealthScore(
      makeNoShow(),
      makeUtilization({ overallUtilization: 20 }),
      makeRevenue(),
      makeServiceMix(),
    );

    expect(good.overall).toBeGreaterThan(bad.overall);
  });

  it('upward revenue trend raises score', () => {
    const up = calculateHealthScore(
      makeNoShow(),
      makeUtilization(),
      makeRevenue({ trendDirection: 'up' }),
      makeServiceMix(),
    );
    const down = calculateHealthScore(
      makeNoShow(),
      makeUtilization(),
      makeRevenue({ trendDirection: 'down' }),
      makeServiceMix(),
    );

    expect(up.overall).toBeGreaterThan(down.overall);
  });

  it('returns at most 3 top actions', () => {
    const result = calculateHealthScore(
      makeNoShow({ noShowRate: 0.15 }),
      makeUtilization({ overallUtilization: 30, deadZones: new Array(5).fill({}) }),
      makeRevenue({ trendDirection: 'down' }),
      makeServiceMix(),
    );

    expect(result.topActions.length).toBeLessThanOrEqual(3);
  });

  it('generates no-show action when rate > 10%', () => {
    const result = calculateHealthScore(
      makeNoShow({ noShowRate: 0.15, revenueLost: 500 }),
      makeUtilization(),
      makeRevenue(),
      makeServiceMix(),
    );

    const noShowAction = result.topActions.find((a) => a.category === 'no_show');
    expect(noShowAction).toBeDefined();
    expect(noShowAction?.priority).toBe('high');
  });

  it('actions are sorted by estimated impact', () => {
    const result = calculateHealthScore(
      makeNoShow({ noShowRate: 0.15, revenueLost: 500 }),
      makeUtilization({ overallUtilization: 30, deadZones: new Array(5).fill({}) }),
      makeRevenue({ trendDirection: 'down', total: 5000, avgPerHour: 40 }),
      makeServiceMix(),
    );

    for (let i = 1; i < result.topActions.length; i++) {
      expect(result.topActions[i - 1].estimatedImpact).toBeGreaterThanOrEqual(
        result.topActions[i].estimatedImpact,
      );
    }
  });
});
