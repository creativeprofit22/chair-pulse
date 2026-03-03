import { describe, it, expect } from 'vitest';
import { analyzeServiceMix } from '../../../../src/core/analyzers/service-mix';
import { BookingStatus, type BookingRow } from '../../../../src/core/types/booking';

function makeRow(overrides: Partial<BookingRow> = {}): BookingRow {
  return {
    date: new Date(2025, 0, 6),
    time: '10:00',
    service: 'Haircut',
    duration: 30,
    price: 25,
    status: BookingStatus.COMPLETED,
    staff: 'Sarah',
    ...overrides,
  };
}

describe('analyzeServiceMix', () => {
  it('groups services and calculates metrics', () => {
    const rows: BookingRow[] = [
      makeRow({ service: 'Haircut', price: 25, duration: 30 }),
      makeRow({ service: 'Haircut', price: 25, duration: 30 }),
      makeRow({ service: 'Colour', price: 85, duration: 120 }),
    ];

    const result = analyzeServiceMix(rows);
    expect(result.totalServices).toBe(2);

    const haircut = result.services.find((s) => s.service === 'Haircut');
    expect(haircut?.bookingCount).toBe(2);
    expect(haircut?.totalRevenue).toBe(50);
    expect(haircut?.avgDurationMins).toBe(30);
    expect(haircut?.revenuePerHour).toBe(50); // £50 / 1 hr

    const colour = result.services.find((s) => s.service === 'Colour');
    expect(colour?.bookingCount).toBe(1);
    expect(colour?.totalRevenue).toBe(85);
    expect(colour?.avgDurationMins).toBe(120);
    expect(colour?.revenuePerHour).toBeCloseTo(42.5); // £85 / 2 hrs
  });

  it('only counts completed bookings', () => {
    const rows: BookingRow[] = [
      makeRow({ service: 'Haircut', status: BookingStatus.COMPLETED }),
      makeRow({ service: 'Haircut', status: BookingStatus.NO_SHOW }),
      makeRow({ service: 'Haircut', status: BookingStatus.CANCELLED }),
    ];

    const result = analyzeServiceMix(rows);
    expect(result.services[0].bookingCount).toBe(1);
  });

  it('sorts by revenuePerHour descending', () => {
    const rows: BookingRow[] = [
      makeRow({ service: 'Slow Service', price: 20, duration: 60 }), // £20/hr
      makeRow({ service: 'Fast Service', price: 30, duration: 15 }), // £120/hr
      makeRow({ service: 'Medium Service', price: 50, duration: 60 }), // £50/hr
    ];

    const result = analyzeServiceMix(rows);
    expect(result.services[0].service).toBe('Fast Service');
    expect(result.services[1].service).toBe('Medium Service');
    expect(result.services[2].service).toBe('Slow Service');
  });

  it('calculates revenue share percentage', () => {
    const rows: BookingRow[] = [
      makeRow({ service: 'A', price: 75 }),
      makeRow({ service: 'B', price: 25 }),
    ];

    const result = analyzeServiceMix(rows);
    const a = result.services.find((s) => s.service === 'A');
    const b = result.services.find((s) => s.service === 'B');

    expect(a?.revenueSharePct).toBe(75);
    expect(b?.revenueSharePct).toBe(25);
  });

  it('handles empty data', () => {
    const result = analyzeServiceMix([]);
    expect(result.services).toHaveLength(0);
    expect(result.totalServices).toBe(0);
  });
});
