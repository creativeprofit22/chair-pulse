import type { BookingRow, DataQualityReport, ParseError } from '../types/booking';
import { BookingStatus } from '../types/booking';

const STATUS_MAP: Record<string, BookingStatus> = {
  completed: BookingStatus.COMPLETED,
  complete: BookingStatus.COMPLETED,
  done: BookingStatus.COMPLETED,
  finished: BookingStatus.COMPLETED,
  attended: BookingStatus.COMPLETED,
  showed: BookingStatus.COMPLETED,
  'checked out': BookingStatus.COMPLETED,

  'no show': BookingStatus.NO_SHOW,
  'no-show': BookingStatus.NO_SHOW,
  noshow: BookingStatus.NO_SHOW,
  missed: BookingStatus.NO_SHOW,
  absent: BookingStatus.NO_SHOW,
  'did not attend': BookingStatus.NO_SHOW,
  dna: BookingStatus.NO_SHOW,

  cancelled: BookingStatus.CANCELLED,
  canceled: BookingStatus.CANCELLED,
  cancel: BookingStatus.CANCELLED,
  'client cancelled': BookingStatus.CANCELLED,
  'salon cancelled': BookingStatus.CANCELLED,
  void: BookingStatus.CANCELLED,

  rescheduled: BookingStatus.RESCHEDULED,
  reschedule: BookingStatus.RESCHEDULED,
  moved: BookingStatus.RESCHEDULED,
  changed: BookingStatus.RESCHEDULED,
};

/**
 * Normalize a raw status string to a BookingStatus enum value.
 */
export function normalizeStatus(raw: string): BookingStatus | null {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  return STATUS_MAP[key] ?? null;
}

/**
 * Coerce a price string to a number. Strips currency symbols and commas.
 */
export function coercePrice(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[£$€,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Coerce a duration string to minutes.
 * Handles: "60", "60 min", "1h", "1h 30m", "1:30", "1 hour 30 minutes"
 */
export function coerceDuration(raw: string): number {
  if (!raw) return 0;
  const trimmed = raw.trim().toLowerCase();

  // Pure number — assume minutes
  const pureNum = parseFloat(trimmed);
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return isNaN(pureNum) ? 0 : Math.round(pureNum);
  }

  // "60 min" or "60 mins" or "60 minutes"
  const minMatch = trimmed.match(/^(\d+)\s*(?:min(?:utes?|s)?)\s*$/);
  if (minMatch) return Number(minMatch[1]);

  // "1h" or "1 hour" or "1 hours"
  const hourOnlyMatch = trimmed.match(/^(\d+)\s*(?:h(?:ours?|r)?)\s*$/);
  if (hourOnlyMatch) return Number(hourOnlyMatch[1]) * 60;

  // "1h 30m" or "1h30m" or "1 hour 30 minutes"
  const hhmm = trimmed.match(/^(\d+)\s*(?:h(?:ours?|r)?)\s*(\d+)\s*(?:m(?:in(?:utes?|s)?)?)\s*$/);
  if (hhmm) return Number(hhmm[1]) * 60 + Number(hhmm[2]);

  // "1:30" — hours:minutes
  const colonMatch = trimmed.match(/^(\d+):(\d{2})$/);
  if (colonMatch) return Number(colonMatch[1]) * 60 + Number(colonMatch[2]);

  return 0;
}

/**
 * Validate an array of BookingRows and produce a data quality report.
 */
export function validateRows(rows: BookingRow[]): {
  rows: BookingRow[];
  report: DataQualityReport;
} {
  const errors: ParseError[] = [];
  const validRows: BookingRow[] = [];
  const missingFields: Record<string, number> = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let valid = true;

    if (!row.date || isNaN(row.date.getTime())) {
      missingFields['date'] = (missingFields['date'] ?? 0) + 1;
      errors.push({ row: i, field: 'date', message: 'Invalid or missing date', type: 'error' });
      valid = false;
    }

    if (!row.time) {
      missingFields['time'] = (missingFields['time'] ?? 0) + 1;
      errors.push({ row: i, field: 'time', message: 'Missing time', type: 'error' });
      valid = false;
    }

    if (!row.service) {
      missingFields['service'] = (missingFields['service'] ?? 0) + 1;
      errors.push({ row: i, field: 'service', message: 'Missing service', type: 'error' });
      valid = false;
    }

    if (!row.staff) {
      missingFields['staff'] = (missingFields['staff'] ?? 0) + 1;
      errors.push({ row: i, field: 'staff', message: 'Missing staff', type: 'error' });
      valid = false;
    }

    if (row.duration <= 0) {
      errors.push({
        row: i,
        field: 'duration',
        message: 'Invalid duration, defaulting to 30',
        type: 'warning',
      });
      row.duration = 30;
    }

    if (row.price < 0) {
      errors.push({
        row: i,
        field: 'price',
        message: 'Negative price, defaulting to 0',
        type: 'warning',
      });
      row.price = 0;
    }

    if (valid) {
      validRows.push(row);
    }
  }

  const warnings = errors.filter((e) => e.type === 'warning').map((e) => e.message);

  return {
    rows: validRows,
    report: {
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: rows.length - validRows.length,
      missingFields,
      warnings: [...new Set(warnings)],
    },
  };
}
