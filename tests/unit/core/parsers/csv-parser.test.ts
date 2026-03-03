import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseBookingCsv } from '../../../../src/core/parsers/csv-parser';

const FIXTURES = join(__dirname, '../../../fixtures');

describe('parseBookingCsv', () => {
  it('parses generic CSV fixture', () => {
    const text = readFileSync(join(FIXTURES, 'sample-generic.csv'), 'utf-8');
    const result = parseBookingCsv(text);

    expect(result.headers).toContain('Date');
    expect(result.headers).toContain('Time');
    expect(result.headers).toContain('Service');
    expect(result.headers).toContain('Duration');
    expect(result.headers).toContain('Price');
    expect(result.headers).toContain('Status');
    expect(result.headers).toContain('Staff');
    expect(result.rowCount).toBe(80);
    expect(result.errors).toHaveLength(0);
  });

  it('parses Fresha CSV fixture', () => {
    const text = readFileSync(join(FIXTURES, 'sample-fresha.csv'), 'utf-8');
    const result = parseBookingCsv(text);

    expect(result.headers).toContain('Booking Date');
    expect(result.headers).toContain('Service Name');
    expect(result.headers).toContain('Team Member');
    expect(result.rowCount).toBe(80);
  });

  it('handles BOM-prefixed content', () => {
    const text = '\uFEFFDate,Time,Service\n05/01/2025,09:00,Haircut';
    const result = parseBookingCsv(text);

    expect(result.headers).toEqual(['Date', 'Time', 'Service']);
    expect(result.rowCount).toBe(1);
  });

  it('skips empty lines', () => {
    const text = 'Date,Time,Service\n05/01/2025,09:00,Haircut\n\n06/01/2025,10:00,Beard Trim\n';
    const result = parseBookingCsv(text);

    expect(result.rowCount).toBe(2);
  });

  it('calls progress callback', () => {
    const text = 'Date,Service\n05/01/2025,Haircut';
    let called = false;
    parseBookingCsv(text, () => {
      called = true;
    });
    expect(called).toBe(true);
  });

  it('returns row data as string records', () => {
    const text = 'Date,Service,Price\n05/01/2025,Haircut,25.00';
    const result = parseBookingCsv(text);

    expect(result.rows[0]).toEqual({
      Date: '05/01/2025',
      Service: 'Haircut',
      Price: '25.00',
    });
  });
});
