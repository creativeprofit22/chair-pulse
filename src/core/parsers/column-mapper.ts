import type { ImportFieldDefinition, BookingRow, BookingStatus } from '../types/booking';
import { BookingSystem } from '../types/booking';
import { parseBookingDate, parseBookingTime } from './date-utils';
import { normalizeStatus, coercePrice, coerceDuration } from './validators';

export const BOOKING_IMPORT_FIELDS: readonly ImportFieldDefinition[] = [
  {
    id: 'date',
    label: 'Date',
    required: true,
    aliases: [
      'date',
      'booking date',
      'appointment date',
      'appt date',
      'visit date',
      'service date',
    ],
  },
  {
    id: 'time',
    label: 'Time',
    required: true,
    aliases: [
      'time',
      'booking time',
      'appointment time',
      'appt time',
      'start time',
      'start',
      'begins at',
    ],
  },
  {
    id: 'service',
    label: 'Service',
    required: true,
    aliases: [
      'service',
      'service name',
      'treatment',
      'treatment name',
      'service type',
      'service description',
    ],
  },
  {
    id: 'duration',
    label: 'Duration',
    required: true,
    aliases: [
      'duration',
      'duration (min)',
      'duration (mins)',
      'duration minutes',
      'length',
      'service duration',
      'time (min)',
    ],
  },
  {
    id: 'price',
    label: 'Price',
    required: true,
    aliases: [
      'price',
      'amount',
      'total',
      'total price',
      'service price',
      'cost',
      'charge',
      'revenue',
      'sale amount',
    ],
  },
  {
    id: 'status',
    label: 'Status',
    required: true,
    aliases: ['status', 'booking status', 'appointment status', 'appt status', 'state', 'outcome'],
  },
  {
    id: 'staff',
    label: 'Staff',
    required: true,
    aliases: [
      'staff',
      'staff member',
      'stylist',
      'barber',
      'provider',
      'team member',
      'employee',
      'therapist',
      'technician',
    ],
  },
  {
    id: 'client',
    label: 'Client',
    required: false,
    aliases: ['client', 'client name', 'customer', 'customer name', 'guest', 'name'],
  },
  {
    id: 'depositPaid',
    label: 'Deposit Paid',
    required: false,
    aliases: [
      'deposit paid',
      'deposit',
      'deposit status',
      'prepaid',
      'advance paid',
      'paid deposit',
    ],
  },
] as const;

/** System-specific header signatures for auto-detection */
const SYSTEM_SIGNATURES: Record<BookingSystem, string[]> = {
  [BookingSystem.FRESHA]: ['Booking Date', 'Booking Time', 'Service Name', 'Team Member'],
  [BookingSystem.BOOKSY]: ['Appointment Date', 'Start Time', 'Service Description', 'Provider'],
  [BookingSystem.SQUARE]: ['Appt Date', 'Appt Time', 'Service Type', 'Staff Member'],
  [BookingSystem.TIMELY]: ['Visit Date', 'Begins At', 'Treatment Name', 'Stylist'],
  [BookingSystem.GENERIC]: [],
};

/**
 * Detect which booking system the CSV came from by matching header patterns.
 */
export function detectBookingSystem(headers: string[]): BookingSystem {
  const headersLower = headers.map((h) => h.toLowerCase().trim());

  for (const [system, signature] of Object.entries(SYSTEM_SIGNATURES)) {
    if (system === BookingSystem.GENERIC) continue;
    const sigLower = signature.map((s) => s.toLowerCase());
    const matchCount = sigLower.filter((s) => headersLower.includes(s)).length;
    if (matchCount >= 3) {
      return system as BookingSystem;
    }
  }

  return BookingSystem.GENERIC;
}

/**
 * Auto-suggest column mappings from CSV headers to booking fields.
 * Returns a mapping of fieldId → csvHeader (or '__skip' if no match).
 */
export function autoSuggestMappings(
  csvHeaders: string[],
  fields: readonly ImportFieldDefinition[] = BOOKING_IMPORT_FIELDS,
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const headersLower = csvHeaders.map((h) => h.toLowerCase().trim());

  for (const field of fields) {
    const match = csvHeaders.find(
      (_header, i) =>
        field.aliases.some((a) => headersLower[i] === a) ||
        headersLower[i] === field.id.toLowerCase(),
    );
    mapping[field.id] = match ?? '__skip';
  }

  return mapping;
}

/**
 * Apply a column mapping to raw CSV rows, producing typed BookingRow[].
 */
export function applyMapping(
  rawRows: Record<string, string>[],
  mapping: Record<string, string>,
): BookingRow[] {
  const results: BookingRow[] = [];

  for (const row of rawRows) {
    const getValue = (fieldId: string): string => {
      const header = mapping[fieldId];
      if (!header || header === '__skip') return '';
      return (row[header] ?? '').trim();
    };

    const dateStr = getValue('date');
    const timeStr = getValue('time');
    const date = parseBookingDate(dateStr);
    const time = parseBookingTime(timeStr);

    if (!date || !time) continue;

    const service = getValue('service');
    const staff = getValue('staff');
    if (!service || !staff) continue;

    const status = normalizeStatus(getValue('status'));
    if (!status) continue;

    const duration = coerceDuration(getValue('duration'));
    const price = coercePrice(getValue('price'));

    const booking: BookingRow = {
      date,
      time,
      service,
      duration,
      price,
      status: status as BookingStatus,
      staff,
    };

    const client = getValue('client');
    if (client) booking.client = client;

    const deposit = getValue('depositPaid');
    if (deposit) {
      booking.depositPaid = ['yes', 'true', '1', 'paid'].includes(deposit.toLowerCase());
    }

    results.push(booking);
  }

  return results;
}
