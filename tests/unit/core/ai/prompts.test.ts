import { describe, it, expect } from 'vitest';
import { buildNoShowPrompt } from '../../../../src/core/ai/prompts/no-show';
import { buildUtilizationPrompt } from '../../../../src/core/ai/prompts/utilization';
import { buildRevenuePrompt } from '../../../../src/core/ai/prompts/revenue';
import { buildActionPlanPrompt } from '../../../../src/core/ai/prompts/action-plan';
import { SYSTEM_PROMPT } from '../../../../src/core/ai/prompts/system';
import type { FullAnalysisReport } from '../../../../src/core/types/analysis';

function makeMockReport(): FullAnalysisReport {
  return {
    noShow: {
      totalBookings: 100,
      noShowCount: 12,
      noShowRate: 0.12,
      revenueLost: 480,
      byDayOfWeek: [
        { label: 'Monday', count: 5, rate: 0.2, revenueImpact: 200 },
        { label: 'Friday', count: 3, rate: 0.1, revenueImpact: 120 },
      ],
      byTimeOfDay: [
        { label: 'Morning', count: 8, rate: 0.15, revenueImpact: 320 },
        { label: 'Afternoon', count: 4, rate: 0.08, revenueImpact: 160 },
      ],
      byService: [
        { label: 'Haircut', count: 6, rate: 0.15, revenueImpact: 150 },
        { label: 'Colour', count: 4, rate: 0.1, revenueImpact: 340 },
      ],
      byStaff: [{ label: 'Sarah', count: 7, rate: 0.14, revenueImpact: 280 }],
      byDepositStatus: [
        { label: 'No Deposit', count: 10, rate: 0.18, revenueImpact: 400 },
        { label: 'Deposit Paid', count: 2, rate: 0.04, revenueImpact: 80 },
      ],
    },
    utilization: {
      cells: [],
      overallUtilization: 52.3,
      deadZones: [
        {
          day: 0,
          hour: 15,
          bookingCount: 1,
          bookedMinutes: 15,
          availableMinutes: 60,
          utilizationPct: 15,
          revenue: 12,
          revenuePerHour: 12,
        },
      ],
      peakZones: [
        {
          day: 5,
          hour: 10,
          bookingCount: 4,
          bookedMinutes: 55,
          availableMinutes: 60,
          utilizationPct: 92,
          revenue: 85,
          revenuePerHour: 85,
        },
      ],
      operatingHours: {},
    },
    revenue: {
      total: 4200,
      avgPerBooking: 42,
      avgPerHour: 35,
      byDayOfWeek: [],
      byTimeSlot: [],
      weeklyTrend: [],
      trendDirection: 'up',
    },
    serviceMix: {
      services: [
        {
          service: 'Colour',
          bookingCount: 20,
          totalRevenue: 1700,
          avgDurationMins: 120,
          revenuePerHour: 85,
          revenueSharePct: 40.5,
        },
        {
          service: 'Haircut',
          bookingCount: 40,
          totalRevenue: 1000,
          avgDurationMins: 30,
          revenuePerHour: 50,
          revenueSharePct: 23.8,
        },
      ],
      totalServices: 5,
    },
    pricing: {
      slots: [],
      offPeakDiscount: 0.15,
      peakPremium: 0.1,
      currentTotal: 4200,
      projectedTotal: 4500,
      revenueImpact: 300,
    },
    health: {
      overall: 62,
      subScores: [
        { label: 'No-Shows', score: 55, weight: 0.3 },
        { label: 'Utilization', score: 65, weight: 0.3 },
      ],
      topActions: [
        {
          title: 'Add deposits for Monday bookings',
          description: 'Monday has the highest no-show rate at 20%.',
          category: 'no_show',
          priority: 'high',
          estimatedImpact: 200,
        },
      ],
    },
    generatedAt: new Date(),
    bookingCount: 100,
    dateRange: { start: new Date(2025, 0, 1), end: new Date(2025, 2, 31) },
  };
}

describe('SYSTEM_PROMPT', () => {
  it('instructs JSON output format', () => {
    expect(SYSTEM_PROMPT).toContain('JSON');
    expect(SYSTEM_PROMPT).toContain('recommendations');
  });

  it('mentions salon context', () => {
    expect(SYSTEM_PROMPT).toContain('salon');
  });
});

describe('buildNoShowPrompt', () => {
  it('includes no-show rate and revenue lost', () => {
    const report = makeMockReport();
    const prompt = buildNoShowPrompt(report.noShow);

    expect(prompt).toContain('12.0%');
    expect(prompt).toContain('480');
  });

  it('identifies worst day', () => {
    const report = makeMockReport();
    const prompt = buildNoShowPrompt(report.noShow);

    expect(prompt).toContain('Monday');
    expect(prompt).toContain('20.0%');
  });

  it('includes deposit breakdown when available', () => {
    const report = makeMockReport();
    const prompt = buildNoShowPrompt(report.noShow);

    expect(prompt).toContain('No Deposit');
    expect(prompt).toContain('Deposit Paid');
  });

  it('handles empty deposit data', () => {
    const report = makeMockReport();
    report.noShow.byDepositStatus = [];
    const prompt = buildNoShowPrompt(report.noShow);

    expect(prompt).toContain('No deposit data available');
  });
});

describe('buildUtilizationPrompt', () => {
  it('includes overall utilization', () => {
    const report = makeMockReport();
    const prompt = buildUtilizationPrompt(report.utilization);

    expect(prompt).toContain('52.3%');
  });

  it('lists dead and peak zones', () => {
    const report = makeMockReport();
    const prompt = buildUtilizationPrompt(report.utilization);

    expect(prompt).toContain('Mon 15:00');
    expect(prompt).toContain('Sat 10:00');
  });
});

describe('buildRevenuePrompt', () => {
  it('includes revenue overview', () => {
    const report = makeMockReport();
    const prompt = buildRevenuePrompt(report.revenue, report.serviceMix);

    expect(prompt).toContain('4200');
    expect(prompt).toContain('42');
    expect(prompt).toContain('up');
  });

  it('includes top services', () => {
    const report = makeMockReport();
    const prompt = buildRevenuePrompt(report.revenue, report.serviceMix);

    expect(prompt).toContain('Colour');
    expect(prompt).toContain('85/hr');
  });
});

describe('buildActionPlanPrompt', () => {
  it('includes health score and key metrics', () => {
    const report = makeMockReport();
    const prompt = buildActionPlanPrompt(report);

    expect(prompt).toContain('62/100');
    expect(prompt).toContain('12.0%');
    expect(prompt).toContain('52.3%');
  });

  it('includes pricing model potential', () => {
    const report = makeMockReport();
    const prompt = buildActionPlanPrompt(report);

    expect(prompt).toContain('+');
    expect(prompt).toContain('300');
  });

  it('includes existing data-identified actions', () => {
    const report = makeMockReport();
    const prompt = buildActionPlanPrompt(report);

    expect(prompt).toContain('Add deposits for Monday bookings');
    expect(prompt).toContain('HIGH');
  });

  it('requests exactly 5 recommendations', () => {
    const report = makeMockReport();
    const prompt = buildActionPlanPrompt(report);

    expect(prompt).toContain('exactly 5');
  });
});
