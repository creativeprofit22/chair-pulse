const MONTH_NAMES: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

// ISO 8601: 2025-03-15 or 2025-03-15T10:30:00
const ISO_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})/;

// DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
const DMY_RE = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;

// "5 March 2025" or "15 Jan 2025" or "March 5, 2025"
const NAMED_DMY_RE = /^(\d{1,2})\s+(\w+)\s+(\d{4})$/;
const NAMED_MDY_RE = /^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/;

/**
 * Parse a date string in various formats.
 * For ambiguous DD/MM vs MM/DD, defaults to DD/MM (UK/EU — common for salon software).
 */
export function parseBookingDate(str: string): Date | null {
  if (!str || !str.trim()) return null;
  const trimmed = str.trim();

  // ISO 8601
  const isoMatch = trimmed.match(ISO_RE);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return isValidDate(d) ? d : null;
  }

  // Named month: "5 March 2025"
  const namedDmy = trimmed.match(NAMED_DMY_RE);
  if (namedDmy) {
    const month = MONTH_NAMES[namedDmy[2].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(Number(namedDmy[3]), month, Number(namedDmy[1]));
      return isValidDate(d) ? d : null;
    }
  }

  // Named month: "March 5, 2025"
  const namedMdy = trimmed.match(NAMED_MDY_RE);
  if (namedMdy) {
    const month = MONTH_NAMES[namedMdy[1].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(Number(namedMdy[3]), month, Number(namedMdy[2]));
      return isValidDate(d) ? d : null;
    }
  }

  // DD/MM/YYYY (default interpretation for ambiguous dates)
  const dmyMatch = trimmed.match(DMY_RE);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    const d = new Date(year, month - 1, day);
    return isValidDate(d) ? d : null;
  }

  return null;
}

// 12hr: "2:30 PM", "2:30PM", "14:30", "9:00"
const TIME_12H_RE = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i;
const TIME_24H_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Parse a time string into "HH:mm" 24-hour format.
 */
export function parseBookingTime(str: string): string | null {
  if (!str || !str.trim()) return null;
  const trimmed = str.trim();

  // 12-hour format
  const match12 = trimmed.match(TIME_12H_RE);
  if (match12) {
    let hours = Number(match12[1]);
    const minutes = Number(match12[2]);
    const period = match12[3].toLowerCase();
    if (hours < 1 || hours > 12 || minutes > 59) return null;
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // 24-hour format
  const match24 = trimmed.match(TIME_24H_RE);
  if (match24) {
    const hours = Number(match24[1]);
    const minutes = Number(match24[2]);
    if (hours > 23 || minutes > 59) return null;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  return null;
}

function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}
