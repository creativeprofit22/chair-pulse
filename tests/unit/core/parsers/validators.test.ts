import { describe, it, expect } from 'vitest';
import {
  normalizeStatus,
  coercePrice,
  coerceDuration,
  validateRows,
} from '../../../../src/core/parsers/validators';
import { BookingStatus } from '../../../../src/core/types/booking';
import type { BookingRow } from '../../../../src/core/types/booking';

describe('normalizeStatus', () => {
  it('normalizes "Completed" variants', () => {
    expect(normalizeStatus('Completed')).toBe(BookingStatus.COMPLETED);
    expect(normalizeStatus('complete')).toBe(BookingStatus.COMPLETED);
    expect(normalizeStatus('Done')).toBe(BookingStatus.COMPLETED);
    expect(normalizeStatus('Attended')).toBe(BookingStatus.COMPLETED);
    expect(normalizeStatus('Checked Out')).toBe(BookingStatus.COMPLETED);
  });

  it('normalizes "No Show" variants', () => {
    expect(normalizeStatus('No Show')).toBe(BookingStatus.NO_SHOW);
    expect(normalizeStatus('no-show')).toBe(BookingStatus.NO_SHOW);
    expect(normalizeStatus('noshow')).toBe(BookingStatus.NO_SHOW);
    expect(normalizeStatus('Missed')).toBe(BookingStatus.NO_SHOW);
    expect(normalizeStatus('DNA')).toBe(BookingStatus.NO_SHOW);
  });

  it('normalizes "Cancelled" variants', () => {
    expect(normalizeStatus('Cancelled')).toBe(BookingStatus.CANCELLED);
    expect(normalizeStatus('Canceled')).toBe(BookingStatus.CANCELLED);
    expect(normalizeStatus('Client Cancelled')).toBe(BookingStatus.CANCELLED);
  });

  it('normalizes "Rescheduled" variants', () => {
    expect(normalizeStatus('Rescheduled')).toBe(BookingStatus.RESCHEDULED);
    expect(normalizeStatus('Moved')).toBe(BookingStatus.RESCHEDULED);
  });

  it('returns null for unknown status', () => {
    expect(normalizeStatus('unknown')).toBeNull();
    expect(normalizeStatus('')).toBeNull();
  });

  it('handles whitespace', () => {
    expect(normalizeStatus('  completed  ')).toBe(BookingStatus.COMPLETED);
  });
});

describe('coercePrice', () => {
  it('parses plain number', () => {
    expect(coercePrice('25.00')).toBe(25);
  });

  it('strips pound sign', () => {
    expect(coercePrice('£25.00')).toBe(25);
  });

  it('strips dollar sign', () => {
    expect(coercePrice('$85.50')).toBe(85.5);
  });

  it('strips euro sign', () => {
    expect(coercePrice('€40.00')).toBe(40);
  });

  it('handles commas in large numbers', () => {
    expect(coercePrice('1,250.00')).toBe(1250);
  });

  it('returns 0 for empty string', () => {
    expect(coercePrice('')).toBe(0);
  });

  it('returns 0 for garbage', () => {
    expect(coercePrice('free')).toBe(0);
  });
});

describe('coerceDuration', () => {
  it('parses plain minutes', () => {
    expect(coerceDuration('30')).toBe(30);
  });

  it('parses "60 min"', () => {
    expect(coerceDuration('60 min')).toBe(60);
  });

  it('parses "60 minutes"', () => {
    expect(coerceDuration('60 minutes')).toBe(60);
  });

  it('parses "1h"', () => {
    expect(coerceDuration('1h')).toBe(60);
  });

  it('parses "1 hour"', () => {
    expect(coerceDuration('1 hour')).toBe(60);
  });

  it('parses "1h 30m"', () => {
    expect(coerceDuration('1h 30m')).toBe(90);
  });

  it('parses "1 hour 30 minutes"', () => {
    expect(coerceDuration('1 hour 30 minutes')).toBe(90);
  });

  it('parses "1:30" as hours:minutes', () => {
    expect(coerceDuration('1:30')).toBe(90);
  });

  it('returns 0 for empty string', () => {
    expect(coerceDuration('')).toBe(0);
  });

  it('returns 0 for garbage', () => {
    expect(coerceDuration('long')).toBe(0);
  });
});

describe('validateRows', () => {
  function makeRow(overrides: Partial<BookingRow> = {}): BookingRow {
    return {
      date: new Date(2025, 0, 5),
      time: '09:00',
      service: 'Haircut',
      duration: 30,
      price: 25,
      status: BookingStatus.COMPLETED,
      staff: 'Sarah',
      ...overrides,
    };
  }

  it('validates good rows', () => {
    const rows = [makeRow(), makeRow({ service: 'Trim', staff: 'Mike' })];
    const result = validateRows(rows);

    expect(result.rows).toHaveLength(2);
    expect(result.report.validRows).toBe(2);
    expect(result.report.invalidRows).toBe(0);
  });

  it('rejects rows with invalid date', () => {
    const rows = [makeRow({ date: new Date('invalid') })];
    const result = validateRows(rows);

    expect(result.rows).toHaveLength(0);
    expect(result.report.invalidRows).toBe(1);
    expect(result.report.missingFields['date']).toBe(1);
  });

  it('rejects rows with missing service', () => {
    const rows = [makeRow({ service: '' })];
    const result = validateRows(rows);

    expect(result.rows).toHaveLength(0);
    expect(result.report.missingFields['service']).toBe(1);
  });

  it('rejects rows with missing staff', () => {
    const rows = [makeRow({ staff: '' })];
    const result = validateRows(rows);

    expect(result.rows).toHaveLength(0);
  });

  it('defaults invalid duration to 30', () => {
    const rows = [makeRow({ duration: 0 })];
    const result = validateRows(rows);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].duration).toBe(30);
    expect(result.report.warnings).toContain('Invalid duration, defaulting to 30');
  });

  it('defaults negative price to 0', () => {
    const rows = [makeRow({ price: -10 })];
    const result = validateRows(rows);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].price).toBe(0);
  });

  it('produces correct summary', () => {
    const rows = [
      makeRow(),
      makeRow({ time: '' }), // invalid
      makeRow({ service: 'Trim' }),
    ];
    const result = validateRows(rows);

    expect(result.report.totalRows).toBe(3);
    expect(result.report.validRows).toBe(2);
    expect(result.report.invalidRows).toBe(1);
  });
});
