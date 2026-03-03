import { describe, it, expect } from 'vitest';
import { analyzePricing } from '../../../../src/core/analyzers/pricing';
import { analyzeUtilization } from '../../../../src/core/analyzers/utilization';
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

describe('analyzePricing', () => {
  it('returns 3 time-of-day slots', () => {
    const rows: BookingRow[] = [
      makeRow({ time: '10:00', price: 25 }),
      makeRow({ time: '14:00', price: 40 }),
    ];
    const utilization = analyzeUtilization(rows);
    const result = analyzePricing(rows, utilization);

    expect(result.slots).toHaveLength(3);
    expect(result.slots.map((s) => s.label)).toEqual([
      'Morning (9-12)',
      'Afternoon (12-16)',
      'Evening (16-19)',
    ]);
  });

  it('calculates current revenue per slot', () => {
    const rows: BookingRow[] = [
      makeRow({ time: '10:00', price: 25 }),
      makeRow({ time: '11:00', price: 30 }),
      makeRow({ time: '14:00', price: 40 }),
    ];
    const utilization = analyzeUtilization(rows);
    const result = analyzePricing(rows, utilization);

    const morning = result.slots.find((s) => s.label === 'Morning (9-12)');
    const afternoon = result.slots.find((s) => s.label === 'Afternoon (12-16)');

    expect(morning?.currentRevenue).toBe(55);
    expect(afternoon?.currentRevenue).toBe(40);
  });

  it('sums current and projected totals', () => {
    const rows: BookingRow[] = [makeRow({ time: '10:00', price: 100 })];
    const utilization = analyzeUtilization(rows);
    const result = analyzePricing(rows, utilization);

    expect(result.currentTotal).toBe(100);
    expect(result.projectedTotal).toBeGreaterThan(0);
    expect(result.revenueImpact).toBe(result.projectedTotal - result.currentTotal);
  });

  it('stores discount and premium config', () => {
    const rows: BookingRow[] = [makeRow()];
    const utilization = analyzeUtilization(rows);
    const result = analyzePricing(rows, utilization, 0.2, 0.15);

    expect(result.offPeakDiscount).toBe(0.2);
    expect(result.peakPremium).toBe(0.15);
  });

  it('uses default discount and premium', () => {
    const rows: BookingRow[] = [makeRow()];
    const utilization = analyzeUtilization(rows);
    const result = analyzePricing(rows, utilization);

    expect(result.offPeakDiscount).toBe(0.15);
    expect(result.peakPremium).toBe(0.1);
  });

  it('excludes non-completed bookings from revenue', () => {
    const rows: BookingRow[] = [
      makeRow({ time: '10:00', price: 25, status: BookingStatus.COMPLETED }),
      makeRow({ time: '10:00', price: 30, status: BookingStatus.NO_SHOW }),
    ];
    const utilization = analyzeUtilization(rows);
    const result = analyzePricing(rows, utilization);

    expect(result.currentTotal).toBe(25);
  });

  it('handles empty data', () => {
    const rows: BookingRow[] = [];
    const utilization = analyzeUtilization(rows);
    const result = analyzePricing(rows, utilization);

    expect(result.currentTotal).toBe(0);
    expect(result.projectedTotal).toBe(0);
    expect(result.revenueImpact).toBe(0);
  });
});
