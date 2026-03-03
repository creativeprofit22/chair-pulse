import { describe, it, expect } from 'vitest';
import { generateCsvExport } from '../../../../src/core/export/csv-export';
import type { FullAnalysisReport } from '../../../../src/core/types/analysis';
import type { AIInsightsReport } from '../../../../src/core/types/ai';

function makeMockReport(): FullAnalysisReport {
  return {
    noShow: {
      totalBookings: 100,
      noShowCount: 12,
      noShowRate: 0.12,
      revenueLost: 480,
      byDayOfWeek: [
        { label: 'Monday', count: 5, rate: 0.2, revenueImpact: 200 },
        { label: 'Tuesday', count: 3, rate: 0.08, revenueImpact: 100 },
      ],
      byTimeOfDay: [{ label: 'Morning', count: 8, rate: 0.15, revenueImpact: 320 }],
      byService: [],
      byStaff: [],
      byDepositStatus: [],
    },
    utilization: {
      cells: [],
      overallUtilization: 52.3,
      deadZones: [],
      peakZones: [],
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
          service: 'Haircut',
          bookingCount: 40,
          totalRevenue: 1000,
          avgDurationMins: 30,
          revenuePerHour: 50,
          revenueSharePct: 23.8,
        },
        {
          service: 'Colour',
          bookingCount: 20,
          totalRevenue: 1700,
          avgDurationMins: 120,
          revenuePerHour: 85,
          revenueSharePct: 40.5,
        },
      ],
      totalServices: 2,
    },
    pricing: {
      slots: [
        {
          label: 'Mon 9:00',
          currentRevenue: 100,
          suggestedRevenue: 115,
          isPeak: true,
          utilizationPct: 85,
        },
      ],
      offPeakDiscount: 0.15,
      peakPremium: 0.1,
      currentTotal: 4200,
      projectedTotal: 4500,
      revenueImpact: 300,
    },
    health: {
      overall: 62,
      subScores: [],
      topActions: [
        {
          title: 'Add deposits',
          description: 'Require deposits on Mondays',
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

describe('generateCsvExport', () => {
  it('includes overview section', () => {
    const csv = generateCsvExport(makeMockReport());

    expect(csv).toContain('=== Overview ===');
    expect(csv).toContain('Total Bookings,100');
    expect(csv).toContain('Health Score,62');
  });

  it('includes no-show breakdown', () => {
    const csv = generateCsvExport(makeMockReport());

    expect(csv).toContain('=== No-Show Breakdown by Day ===');
    expect(csv).toContain('Monday');
    expect(csv).toContain('Tuesday');
  });

  it('includes service mix', () => {
    const csv = generateCsvExport(makeMockReport());

    expect(csv).toContain('=== Service Mix ===');
    expect(csv).toContain('Haircut');
    expect(csv).toContain('Colour');
  });

  it('includes pricing model', () => {
    const csv = generateCsvExport(makeMockReport());

    expect(csv).toContain('=== Pricing Model ===');
    expect(csv).toContain('Mon 9:00');
    expect(csv).toContain('Yes');
  });

  it('includes top actions', () => {
    const csv = generateCsvExport(makeMockReport());

    expect(csv).toContain('=== Top Actions ===');
    expect(csv).toContain('Add deposits');
  });

  it('escapes values containing commas', () => {
    const report = makeMockReport();
    report.health.topActions[0].description = 'Do this, then that';
    const csv = generateCsvExport(report);

    expect(csv).toContain('"Do this, then that"');
  });

  it('excludes AI section when no insights provided', () => {
    const csv = generateCsvExport(makeMockReport());
    expect(csv).not.toContain('=== AI Action Plan ===');
  });

  it('includes AI section when insights provided', () => {
    const insights: AIInsightsReport = {
      noShowAdvice: { summary: 'No-show advice', recommendations: [] },
      utilizationAdvice: { summary: 'Util advice', recommendations: [] },
      revenueAdvice: { summary: 'Rev advice', recommendations: [] },
      actionPlan: {
        summary: 'Action summary',
        recommendations: [
          {
            title: 'Test action',
            description: 'Do something',
            category: 'no_show',
            estimatedImpact: 500,
            urgency: 'high',
          },
        ],
      },
      generatedAt: new Date(),
    };

    const csv = generateCsvExport(makeMockReport(), insights);

    expect(csv).toContain('=== AI Action Plan ===');
    expect(csv).toContain('Test action');
    expect(csv).toContain('high');
  });
});
