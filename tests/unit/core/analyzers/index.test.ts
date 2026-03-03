import { describe, it, expect } from 'vitest';
import { runFullAnalysis } from '../../../../src/core/analyzers/index';
import { BookingStatus, type BookingRow } from '../../../../src/core/types/booking';

function makeRow(overrides: Partial<BookingRow> = {}): BookingRow {
  return {
    date: new Date(2025, 0, 6), // Monday
    time: '10:00',
    service: 'Haircut',
    duration: 30,
    price: 25,
    status: BookingStatus.COMPLETED,
    staff: 'Sarah',
    ...overrides,
  };
}

function makeSampleData(): BookingRow[] {
  return [
    makeRow({ date: new Date(2025, 0, 6), time: '09:00', service: 'Haircut', price: 25 }),
    makeRow({
      date: new Date(2025, 0, 6),
      time: '10:00',
      service: 'Colour',
      price: 85,
      duration: 120,
    }),
    makeRow({
      date: new Date(2025, 0, 6),
      time: '11:00',
      status: BookingStatus.NO_SHOW,
      price: 35,
    }),
    makeRow({
      date: new Date(2025, 0, 6),
      time: '14:00',
      service: 'Cut & Finish',
      price: 40,
      duration: 45,
    }),
    makeRow({ date: new Date(2025, 0, 7), time: '09:00', service: 'Haircut', price: 25 }),
    makeRow({
      date: new Date(2025, 0, 7),
      time: '10:00',
      service: 'Beard Trim',
      price: 15,
      duration: 20,
      staff: 'Mike',
    }),
    makeRow({
      date: new Date(2025, 0, 7),
      time: '11:00',
      status: BookingStatus.CANCELLED,
      price: 25,
    }),
    makeRow({
      date: new Date(2025, 0, 7),
      time: '14:00',
      service: 'Highlights',
      price: 65,
      duration: 90,
    }),
    makeRow({ date: new Date(2025, 0, 13), time: '10:00', service: 'Haircut', price: 25 }),
    makeRow({
      date: new Date(2025, 0, 13),
      time: '14:00',
      service: 'Colour',
      price: 85,
      duration: 120,
    }),
  ];
}

describe('runFullAnalysis', () => {
  it('returns a complete FullAnalysisReport', () => {
    const rows = makeSampleData();
    const report = runFullAnalysis(rows);

    expect(report.noShow).toBeDefined();
    expect(report.utilization).toBeDefined();
    expect(report.revenue).toBeDefined();
    expect(report.serviceMix).toBeDefined();
    expect(report.pricing).toBeDefined();
    expect(report.health).toBeDefined();
    expect(report.generatedAt).toBeInstanceOf(Date);
    expect(report.bookingCount).toBe(rows.length);
  });

  it('calculates correct date range', () => {
    const rows = makeSampleData();
    const report = runFullAnalysis(rows);

    expect(report.dateRange.start.getTime()).toBe(new Date(2025, 0, 6).getTime());
    expect(report.dateRange.end.getTime()).toBe(new Date(2025, 0, 13).getTime());
  });

  it('no-show analysis matches booking data', () => {
    const rows = makeSampleData();
    const report = runFullAnalysis(rows);

    expect(report.noShow.totalBookings).toBe(10);
    expect(report.noShow.noShowCount).toBe(1);
  });

  it('revenue only counts completed bookings', () => {
    const rows = makeSampleData();
    const report = runFullAnalysis(rows);

    // 8 completed bookings: 25+85+40+25+15+65+25+85 = 365
    expect(report.revenue.total).toBe(365);
  });

  it('service mix lists unique services', () => {
    const rows = makeSampleData();
    const report = runFullAnalysis(rows);

    expect(report.serviceMix.totalServices).toBeGreaterThanOrEqual(4);
    const names = report.serviceMix.services.map((s) => s.service);
    expect(names).toContain('Haircut');
    expect(names).toContain('Colour');
  });

  it('health score is a number between 0 and 100', () => {
    const rows = makeSampleData();
    const report = runFullAnalysis(rows);

    expect(report.health.overall).toBeGreaterThanOrEqual(0);
    expect(report.health.overall).toBeLessThanOrEqual(100);
  });

  it('accepts optional config', () => {
    const rows = makeSampleData();
    const report = runFullAnalysis(rows, {
      operatingHours: { 0: { start: 8, end: 20 } },
      offPeakDiscount: 0.2,
      peakPremium: 0.15,
    });

    expect(report.pricing.offPeakDiscount).toBe(0.2);
    expect(report.pricing.peakPremium).toBe(0.15);
    // Custom operating hours: only Monday
    expect(report.utilization.cells.length).toBe(12);
  });

  it('handles single booking', () => {
    const rows = [makeRow()];
    const report = runFullAnalysis(rows);

    expect(report.bookingCount).toBe(1);
    expect(report.noShow.noShowCount).toBe(0);
    expect(report.revenue.total).toBe(25);
  });
});
