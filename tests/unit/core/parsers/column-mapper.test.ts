import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  detectBookingSystem,
  autoSuggestMappings,
  applyMapping,
} from '../../../../src/core/parsers/column-mapper';
import { parseBookingCsv } from '../../../../src/core/parsers/csv-parser';
import { BookingSystem, BookingStatus } from '../../../../src/core/types/booking';

const FIXTURES = join(__dirname, '../../../fixtures');

describe('detectBookingSystem', () => {
  it('detects generic system from generic headers', () => {
    const headers = ['Date', 'Time', 'Service', 'Duration', 'Price', 'Status', 'Staff'];
    expect(detectBookingSystem(headers)).toBe(BookingSystem.GENERIC);
  });

  it('detects Fresha from Fresha-style headers', () => {
    const headers = [
      'Booking Date',
      'Booking Time',
      'Service Name',
      'Duration (min)',
      'Total Price',
      'Booking Status',
      'Team Member',
    ];
    expect(detectBookingSystem(headers)).toBe(BookingSystem.FRESHA);
  });

  it('detects Booksy from Booksy-style headers', () => {
    const headers = [
      'Appointment Date',
      'Start Time',
      'Service Description',
      'Duration',
      'Amount',
      'Status',
      'Provider',
    ];
    expect(detectBookingSystem(headers)).toBe(BookingSystem.BOOKSY);
  });

  it('detects Timely from Timely-style headers', () => {
    const headers = [
      'Visit Date',
      'Begins At',
      'Treatment Name',
      'Duration',
      'Price',
      'Status',
      'Stylist',
    ];
    expect(detectBookingSystem(headers)).toBe(BookingSystem.TIMELY);
  });

  it('is case-insensitive', () => {
    const headers = ['booking date', 'booking time', 'service name', 'team member'];
    expect(detectBookingSystem(headers)).toBe(BookingSystem.FRESHA);
  });
});

describe('autoSuggestMappings', () => {
  it('maps generic headers correctly', () => {
    const headers = [
      'Date',
      'Time',
      'Service',
      'Duration',
      'Price',
      'Status',
      'Staff',
      'Client',
      'Deposit Paid',
    ];
    const mapping = autoSuggestMappings(headers);

    expect(mapping['date']).toBe('Date');
    expect(mapping['time']).toBe('Time');
    expect(mapping['service']).toBe('Service');
    expect(mapping['duration']).toBe('Duration');
    expect(mapping['price']).toBe('Price');
    expect(mapping['status']).toBe('Status');
    expect(mapping['staff']).toBe('Staff');
    expect(mapping['client']).toBe('Client');
    expect(mapping['depositPaid']).toBe('Deposit Paid');
  });

  it('maps Fresha headers correctly', () => {
    const headers = [
      'Booking Date',
      'Booking Time',
      'Service Name',
      'Duration (min)',
      'Total Price',
      'Booking Status',
      'Team Member',
      'Client Name',
    ];
    const mapping = autoSuggestMappings(headers);

    expect(mapping['date']).toBe('Booking Date');
    expect(mapping['time']).toBe('Booking Time');
    expect(mapping['service']).toBe('Service Name');
    expect(mapping['duration']).toBe('Duration (min)');
    expect(mapping['price']).toBe('Total Price');
    expect(mapping['status']).toBe('Booking Status');
    expect(mapping['staff']).toBe('Team Member');
    expect(mapping['client']).toBe('Client Name');
  });

  it('returns __skip for unmatched fields', () => {
    const headers = ['Date', 'Time'];
    const mapping = autoSuggestMappings(headers);

    expect(mapping['service']).toBe('__skip');
    expect(mapping['staff']).toBe('__skip');
  });
});

describe('applyMapping', () => {
  it('converts raw CSV rows to BookingRow[]', () => {
    const text = readFileSync(join(FIXTURES, 'sample-generic.csv'), 'utf-8');
    const { rows, headers } = parseBookingCsv(text);
    const mapping = autoSuggestMappings(headers);
    const bookings = applyMapping(rows, mapping);

    expect(bookings.length).toBeGreaterThan(0);
    expect(bookings[0].date).toBeInstanceOf(Date);
    expect(bookings[0].time).toBe('09:00');
    expect(bookings[0].service).toBe('Haircut');
    expect(bookings[0].duration).toBe(30);
    expect(bookings[0].price).toBe(25);
    expect(bookings[0].status).toBe(BookingStatus.COMPLETED);
    expect(bookings[0].staff).toBe('Sarah');
  });

  it('handles Fresha CSV with currency symbols', () => {
    const text = readFileSync(join(FIXTURES, 'sample-fresha.csv'), 'utf-8');
    const { rows, headers } = parseBookingCsv(text);
    const mapping = autoSuggestMappings(headers);
    const bookings = applyMapping(rows, mapping);

    expect(bookings.length).toBeGreaterThan(0);
    expect(bookings[0].price).toBe(25);
    expect(bookings[0].staff).toBe('Sarah');
  });

  it('skips rows with missing required fields', () => {
    const rawRows = [
      {
        Date: '05/01/2025',
        Time: '09:00',
        Service: 'Haircut',
        Duration: '30',
        Price: '25',
        Status: 'Completed',
        Staff: 'Sarah',
      },
      {
        Date: '',
        Time: '10:00',
        Service: 'Trim',
        Duration: '20',
        Price: '15',
        Status: 'Completed',
        Staff: 'Mike',
      },
    ];
    const mapping = {
      date: 'Date',
      time: 'Time',
      service: 'Service',
      duration: 'Duration',
      price: 'Price',
      status: 'Status',
      staff: 'Staff',
      client: '__skip',
      depositPaid: '__skip',
    };
    const bookings = applyMapping(rawRows, mapping);
    expect(bookings).toHaveLength(1);
  });

  it('parses deposit paid field', () => {
    const rawRows = [
      {
        Date: '05/01/2025',
        Time: '09:00',
        Service: 'Cut',
        Duration: '30',
        Price: '25',
        Status: 'Completed',
        Staff: 'Sarah',
        Deposit: 'Yes',
      },
      {
        Date: '05/01/2025',
        Time: '10:00',
        Service: 'Cut',
        Duration: '30',
        Price: '25',
        Status: 'Completed',
        Staff: 'Sarah',
        Deposit: 'No',
      },
    ];
    const mapping = {
      date: 'Date',
      time: 'Time',
      service: 'Service',
      duration: 'Duration',
      price: 'Price',
      status: 'Status',
      staff: 'Staff',
      client: '__skip',
      depositPaid: 'Deposit',
    };
    const bookings = applyMapping(rawRows, mapping);
    expect(bookings[0].depositPaid).toBe(true);
    expect(bookings[1].depositPaid).toBe(false);
  });
});
