import { describe, it, expect } from 'vitest';
import { analyzeNoShows } from '../../../../src/core/analyzers/no-show';
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
    depositPaid: false,
    ...overrides,
  };
}

describe('analyzeNoShows', () => {
  it('calculates basic no-show metrics', () => {
    const rows: BookingRow[] = [
      makeRow({ status: BookingStatus.COMPLETED }),
      makeRow({ status: BookingStatus.COMPLETED }),
      makeRow({ status: BookingStatus.NO_SHOW, price: 40 }),
      makeRow({ status: BookingStatus.CANCELLED }),
    ];

    const result = analyzeNoShows(rows);

    expect(result.totalBookings).toBe(4);
    expect(result.noShowCount).toBe(1);
    expect(result.noShowRate).toBeCloseTo(0.25);
    expect(result.revenueLost).toBe(40);
  });

  it('returns zero when no bookings', () => {
    const result = analyzeNoShows([]);
    expect(result.totalBookings).toBe(0);
    expect(result.noShowCount).toBe(0);
    expect(result.noShowRate).toBe(0);
    expect(result.revenueLost).toBe(0);
  });

  it('breaks down by day of week', () => {
    const rows: BookingRow[] = [
      makeRow({ date: new Date(2025, 0, 6), status: BookingStatus.COMPLETED }), // Mon
      makeRow({ date: new Date(2025, 0, 6), status: BookingStatus.NO_SHOW }), // Mon
      makeRow({ date: new Date(2025, 0, 7), status: BookingStatus.COMPLETED }), // Tue
    ];

    const result = analyzeNoShows(rows);
    const monday = result.byDayOfWeek.find((b) => b.label === 'Monday');
    const tuesday = result.byDayOfWeek.find((b) => b.label === 'Tuesday');

    expect(monday?.count).toBe(1);
    expect(monday?.rate).toBeCloseTo(0.5);
    expect(tuesday?.count).toBe(0);
    expect(tuesday?.rate).toBe(0);
  });

  it('breaks down by time of day', () => {
    const rows: BookingRow[] = [
      makeRow({ time: '09:00', status: BookingStatus.COMPLETED }),
      makeRow({ time: '09:30', status: BookingStatus.NO_SHOW }),
      makeRow({ time: '14:00', status: BookingStatus.COMPLETED }),
      makeRow({ time: '14:30', status: BookingStatus.NO_SHOW }),
      makeRow({ time: '18:00', status: BookingStatus.COMPLETED }),
    ];

    const result = analyzeNoShows(rows);
    const morning = result.byTimeOfDay.find((b) => b.label === 'Morning');
    const afternoon = result.byTimeOfDay.find((b) => b.label === 'Afternoon');
    const evening = result.byTimeOfDay.find((b) => b.label === 'Evening');

    expect(morning?.count).toBe(1);
    expect(afternoon?.count).toBe(1);
    expect(evening?.count).toBe(0);
  });

  it('breaks down by service', () => {
    const rows: BookingRow[] = [
      makeRow({ service: 'Haircut', status: BookingStatus.COMPLETED }),
      makeRow({ service: 'Haircut', status: BookingStatus.NO_SHOW }),
      makeRow({ service: 'Colour', status: BookingStatus.COMPLETED }),
    ];

    const result = analyzeNoShows(rows);
    const haircut = result.byService.find((b) => b.label === 'Haircut');
    const colour = result.byService.find((b) => b.label === 'Colour');

    expect(haircut?.count).toBe(1);
    expect(haircut?.rate).toBeCloseTo(0.5);
    expect(colour?.count).toBe(0);
  });

  it('breaks down by staff', () => {
    const rows: BookingRow[] = [
      makeRow({ staff: 'Sarah', status: BookingStatus.COMPLETED }),
      makeRow({ staff: 'Sarah', status: BookingStatus.NO_SHOW }),
      makeRow({ staff: 'Mike', status: BookingStatus.COMPLETED }),
    ];

    const result = analyzeNoShows(rows);
    const sarah = result.byStaff.find((b) => b.label === 'Sarah');
    const mike = result.byStaff.find((b) => b.label === 'Mike');

    expect(sarah?.count).toBe(1);
    expect(mike?.count).toBe(0);
  });

  it('breaks down by deposit status', () => {
    const rows: BookingRow[] = [
      makeRow({ depositPaid: true, status: BookingStatus.COMPLETED }),
      makeRow({ depositPaid: true, status: BookingStatus.COMPLETED }),
      makeRow({ depositPaid: false, status: BookingStatus.NO_SHOW }),
      makeRow({ depositPaid: false, status: BookingStatus.NO_SHOW }),
      makeRow({ depositPaid: false, status: BookingStatus.COMPLETED }),
    ];

    const result = analyzeNoShows(rows);
    const withDeposit = result.byDepositStatus.find((b) => b.label === 'With Deposit');
    const withoutDeposit = result.byDepositStatus.find((b) => b.label === 'Without Deposit');

    expect(withDeposit?.count).toBe(0);
    expect(withDeposit?.rate).toBe(0);
    expect(withoutDeposit?.count).toBe(2);
    expect(withoutDeposit?.rate).toBeCloseTo(2 / 3);
  });

  it('includes all 7 days in byDayOfWeek', () => {
    const rows: BookingRow[] = [makeRow()];
    const result = analyzeNoShows(rows);
    expect(result.byDayOfWeek).toHaveLength(7);
  });

  it('includes all 3 time slots in byTimeOfDay', () => {
    const rows: BookingRow[] = [makeRow()];
    const result = analyzeNoShows(rows);
    expect(result.byTimeOfDay).toHaveLength(3);
  });
});
