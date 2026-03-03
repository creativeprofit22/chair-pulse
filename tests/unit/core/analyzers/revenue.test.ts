import { describe, it, expect } from 'vitest';
import { analyzeRevenue } from '../../../../src/core/analyzers/revenue';
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

describe('analyzeRevenue', () => {
  it('calculates total revenue from completed bookings only', () => {
    const rows: BookingRow[] = [
      makeRow({ price: 25 }),
      makeRow({ price: 40 }),
      makeRow({ price: 30, status: BookingStatus.NO_SHOW }),
      makeRow({ price: 20, status: BookingStatus.CANCELLED }),
    ];

    const result = analyzeRevenue(rows);
    expect(result.total).toBe(65);
  });

  it('calculates average per booking', () => {
    const rows: BookingRow[] = [makeRow({ price: 20 }), makeRow({ price: 40 })];

    const result = analyzeRevenue(rows);
    expect(result.avgPerBooking).toBe(30);
  });

  it('calculates average per hour', () => {
    const rows: BookingRow[] = [
      makeRow({ price: 30, duration: 60 }), // £30/hr
      makeRow({ price: 50, duration: 30 }), // £100/hr
    ];

    const result = analyzeRevenue(rows);
    // Total: £80, Duration: 90 min = 1.5 hr → £53.33/hr
    expect(result.avgPerHour).toBeCloseTo(53.33, 1);
  });

  it('breaks down by day of week', () => {
    const rows: BookingRow[] = [
      makeRow({ date: new Date(2025, 0, 6), price: 25 }), // Mon
      makeRow({ date: new Date(2025, 0, 7), price: 35 }), // Tue
      makeRow({ date: new Date(2025, 0, 7), price: 40 }), // Tue
    ];

    const result = analyzeRevenue(rows);
    const monday = result.byDayOfWeek.find((b) => b.label === 'Monday');
    const tuesday = result.byDayOfWeek.find((b) => b.label === 'Tuesday');

    expect(monday?.total).toBe(25);
    expect(tuesday?.total).toBe(75);
  });

  it('breaks down by time slot', () => {
    const rows: BookingRow[] = [
      makeRow({ time: '09:00', price: 25 }),
      makeRow({ time: '14:00', price: 40 }),
      makeRow({ time: '18:00', price: 30 }),
    ];

    const result = analyzeRevenue(rows);
    const morning = result.byTimeSlot.find((b) => b.label === 'Morning');
    const afternoon = result.byTimeSlot.find((b) => b.label === 'Afternoon');
    const evening = result.byTimeSlot.find((b) => b.label === 'Evening');

    expect(morning?.total).toBe(25);
    expect(afternoon?.total).toBe(40);
    expect(evening?.total).toBe(30);
  });

  it('calculates weekly trend', () => {
    const rows: BookingRow[] = [
      makeRow({ date: new Date(2025, 0, 6), price: 100 }), // Week 1 (Mon Jan 6)
      makeRow({ date: new Date(2025, 0, 7), price: 50 }), // Week 1 (Tue Jan 7)
      makeRow({ date: new Date(2025, 0, 13), price: 200 }), // Week 2 (Mon Jan 13)
    ];

    const result = analyzeRevenue(rows);
    expect(result.weeklyTrend).toHaveLength(2);
    expect(result.weeklyTrend[0].total).toBe(150);
    expect(result.weeklyTrend[1].total).toBe(200);
  });

  it('detects upward trend', () => {
    const rows: BookingRow[] = [
      makeRow({ date: new Date(2025, 0, 6), price: 100 }),
      makeRow({ date: new Date(2025, 0, 13), price: 200 }),
    ];

    const result = analyzeRevenue(rows);
    expect(result.trendDirection).toBe('up');
  });

  it('detects downward trend', () => {
    const rows: BookingRow[] = [
      makeRow({ date: new Date(2025, 0, 6), price: 200 }),
      makeRow({ date: new Date(2025, 0, 13), price: 100 }),
    ];

    const result = analyzeRevenue(rows);
    expect(result.trendDirection).toBe('down');
  });

  it('returns flat for single week', () => {
    const rows: BookingRow[] = [makeRow({ date: new Date(2025, 0, 6), price: 100 })];

    const result = analyzeRevenue(rows);
    expect(result.trendDirection).toBe('flat');
  });

  it('handles empty data', () => {
    const result = analyzeRevenue([]);
    expect(result.total).toBe(0);
    expect(result.avgPerBooking).toBe(0);
    expect(result.avgPerHour).toBe(0);
    expect(result.weeklyTrend).toHaveLength(0);
    expect(result.trendDirection).toBe('flat');
  });
});
