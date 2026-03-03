import { describe, it, expect } from 'vitest';
import { parseBookingDate, parseBookingTime } from '../../../../src/core/parsers/date-utils';

describe('parseBookingDate', () => {
  it('parses DD/MM/YYYY format', () => {
    const d = parseBookingDate('05/01/2025');
    expect(d).toBeInstanceOf(Date);
    expect(d!.getDate()).toBe(5);
    expect(d!.getMonth()).toBe(0); // January
    expect(d!.getFullYear()).toBe(2025);
  });

  it('parses DD-MM-YYYY format', () => {
    const d = parseBookingDate('15-03-2025');
    expect(d!.getDate()).toBe(15);
    expect(d!.getMonth()).toBe(2); // March
  });

  it('parses DD.MM.YYYY format', () => {
    const d = parseBookingDate('22.12.2024');
    expect(d!.getDate()).toBe(22);
    expect(d!.getMonth()).toBe(11); // December
  });

  it('parses YYYY-MM-DD (ISO) format', () => {
    const d = parseBookingDate('2025-03-15');
    expect(d!.getDate()).toBe(15);
    expect(d!.getMonth()).toBe(2);
    expect(d!.getFullYear()).toBe(2025);
  });

  it('parses ISO 8601 with time component', () => {
    const d = parseBookingDate('2025-03-15T10:30:00');
    expect(d!.getDate()).toBe(15);
    expect(d!.getMonth()).toBe(2);
  });

  it('parses "5 March 2025" named format', () => {
    const d = parseBookingDate('5 March 2025');
    expect(d!.getDate()).toBe(5);
    expect(d!.getMonth()).toBe(2);
    expect(d!.getFullYear()).toBe(2025);
  });

  it('parses "15 Jan 2025" abbreviated month', () => {
    const d = parseBookingDate('15 Jan 2025');
    expect(d!.getDate()).toBe(15);
    expect(d!.getMonth()).toBe(0);
  });

  it('parses "March 5, 2025" named MDY format', () => {
    const d = parseBookingDate('March 5, 2025');
    expect(d!.getDate()).toBe(5);
    expect(d!.getMonth()).toBe(2);
  });

  it('parses "December 25 2025" without comma', () => {
    const d = parseBookingDate('December 25 2025');
    expect(d!.getDate()).toBe(25);
    expect(d!.getMonth()).toBe(11);
  });

  it('returns null for empty string', () => {
    expect(parseBookingDate('')).toBeNull();
  });

  it('returns null for garbage input', () => {
    expect(parseBookingDate('not a date')).toBeNull();
  });

  it('handles whitespace', () => {
    const d = parseBookingDate('  05/01/2025  ');
    expect(d!.getDate()).toBe(5);
  });
});

describe('parseBookingTime', () => {
  it('parses 24-hour format "14:30"', () => {
    expect(parseBookingTime('14:30')).toBe('14:30');
  });

  it('parses 24-hour format "09:00"', () => {
    expect(parseBookingTime('09:00')).toBe('09:00');
  });

  it('parses 24-hour with seconds "14:30:00"', () => {
    expect(parseBookingTime('14:30:00')).toBe('14:30');
  });

  it('parses 12-hour format "2:30 PM"', () => {
    expect(parseBookingTime('2:30 PM')).toBe('14:30');
  });

  it('parses 12-hour format "2:30PM" without space', () => {
    expect(parseBookingTime('2:30PM')).toBe('14:30');
  });

  it('parses 12-hour format "9:00 AM"', () => {
    expect(parseBookingTime('9:00 AM')).toBe('09:00');
  });

  it('parses 12:00 PM as noon', () => {
    expect(parseBookingTime('12:00 PM')).toBe('12:00');
  });

  it('parses 12:00 AM as midnight', () => {
    expect(parseBookingTime('12:00 AM')).toBe('00:00');
  });

  it('returns null for empty string', () => {
    expect(parseBookingTime('')).toBeNull();
  });

  it('returns null for invalid time', () => {
    expect(parseBookingTime('25:00')).toBeNull();
  });

  it('returns null for garbage', () => {
    expect(parseBookingTime('not a time')).toBeNull();
  });

  it('handles whitespace', () => {
    expect(parseBookingTime('  14:30  ')).toBe('14:30');
  });
});
