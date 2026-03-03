import { describe, it, expect } from 'vitest';
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

describe('analyzeUtilization', () => {
  it('creates cells for operating hours', () => {
    const rows: BookingRow[] = [makeRow()];
    const result = analyzeUtilization(rows);

    // Default: Mon-Sat 9-19 = 6 days × 10 hours = 60 cells
    expect(result.cells.length).toBe(60);
    expect(result.operatingHours[0]).toEqual({ start: 9, end: 19 });
  });

  it('calculates utilization for a booking', () => {
    const rows: BookingRow[] = [makeRow({ time: '10:00', duration: 30, price: 25 })];

    const result = analyzeUtilization(rows);
    const cell = result.cells.find((c) => c.day === 0 && c.hour === 10);

    expect(cell?.bookingCount).toBe(1);
    expect(cell?.bookedMinutes).toBe(30);
    expect(cell?.availableMinutes).toBe(60);
    expect(cell?.utilizationPct).toBeCloseTo(50);
    expect(cell?.revenue).toBe(25);
  });

  it('excludes no-show and cancelled bookings from utilization', () => {
    const rows: BookingRow[] = [
      makeRow({ time: '10:00', status: BookingStatus.COMPLETED }),
      makeRow({ time: '10:00', status: BookingStatus.NO_SHOW }),
      makeRow({ time: '10:00', status: BookingStatus.CANCELLED }),
    ];

    const result = analyzeUtilization(rows);
    const cell = result.cells.find((c) => c.day === 0 && c.hour === 10);

    expect(cell?.bookingCount).toBe(1);
  });

  it('calculates overall utilization', () => {
    const rows: BookingRow[] = [makeRow({ time: '10:00', duration: 60 })];

    const result = analyzeUtilization(rows);
    // 60 booked out of 600 available (1 day, 10 hours × 60 min)
    expect(result.overallUtilization).toBeCloseTo(10);
  });

  it('identifies dead zones (< 25% utilization)', () => {
    const rows: BookingRow[] = [
      makeRow({ time: '10:00', duration: 10 }), // 10/60 = 16.7%
    ];

    const result = analyzeUtilization(rows);
    // Most cells have 0 utilization, so they are dead zones
    // But only cells with available minutes > 0 count
    expect(result.deadZones.length).toBeGreaterThan(0);
    for (const zone of result.deadZones) {
      expect(zone.utilizationPct).toBeLessThan(25);
    }
  });

  it('identifies peak zones (> 80% utilization)', () => {
    const rows: BookingRow[] = [
      makeRow({ time: '10:00', duration: 55 }), // 55/60 = 91.7%
    ];

    const result = analyzeUtilization(rows);
    const peak = result.peakZones.find((c) => c.day === 0 && c.hour === 10);

    expect(peak).toBeDefined();
    expect(peak?.utilizationPct).toBeGreaterThan(80);
  });

  it('accepts custom operating hours', () => {
    const customHours = {
      0: { start: 8, end: 20 }, // Monday only, 12 hours
    };

    const rows: BookingRow[] = [makeRow({ time: '08:00', duration: 30 })];

    const result = analyzeUtilization(rows, customHours);
    expect(result.cells.length).toBe(12);
    expect(result.cells[0].hour).toBe(8);
  });

  it('aggregates multiple bookings in same cell', () => {
    const rows: BookingRow[] = [
      makeRow({ time: '10:00', duration: 20, price: 15 }),
      makeRow({ time: '10:00', duration: 30, price: 25 }),
    ];

    const result = analyzeUtilization(rows);
    const cell = result.cells.find((c) => c.day === 0 && c.hour === 10);

    expect(cell?.bookingCount).toBe(2);
    expect(cell?.bookedMinutes).toBe(50);
    expect(cell?.revenue).toBe(40);
  });

  it('cells are sorted by day then hour', () => {
    const rows: BookingRow[] = [makeRow()];
    const result = analyzeUtilization(rows);

    for (let i = 1; i < result.cells.length; i++) {
      const prev = result.cells[i - 1];
      const curr = result.cells[i];
      const prevKey = prev.day * 100 + prev.hour;
      const currKey = curr.day * 100 + curr.hour;
      expect(currKey).toBeGreaterThan(prevKey);
    }
  });
});
