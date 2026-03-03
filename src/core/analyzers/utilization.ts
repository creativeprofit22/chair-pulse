import type { BookingRow } from '../types/booking';
import { BookingStatus } from '../types/booking';
import type { UtilizationAnalysis, UtilizationCell } from '../types/analysis';

const DEFAULT_OPERATING_HOURS: Record<number, { start: number; end: number }> = {
  0: { start: 9, end: 19 }, // Monday
  1: { start: 9, end: 19 }, // Tuesday
  2: { start: 9, end: 19 }, // Wednesday
  3: { start: 9, end: 19 }, // Thursday
  4: { start: 9, end: 19 }, // Friday
  5: { start: 9, end: 19 }, // Saturday
  // Sunday: closed by default
};

function getDayIndex(date: Date): number {
  return (date.getDay() + 6) % 7; // 0=Mon, 6=Sun
}

function getHour(time: string): number {
  return parseInt(time.split(':')[0], 10);
}

export function analyzeUtilization(
  rows: BookingRow[],
  operatingHours?: Record<number, { start: number; end: number }>,
): UtilizationAnalysis {
  const hours = operatingHours ?? DEFAULT_OPERATING_HOURS;

  // Only count completed bookings for utilization
  const completed = rows.filter((r) => r.status === BookingStatus.COMPLETED);

  // Count how many times each day of week appears in the data
  const dayOccurrences = new Map<number, Set<string>>();
  for (const row of rows) {
    const dayIdx = getDayIndex(row.date);
    if (!dayOccurrences.has(dayIdx)) {
      dayOccurrences.set(dayIdx, new Set());
    }
    dayOccurrences.get(dayIdx)!.add(row.date.toISOString().slice(0, 10));
  }

  // Build cells for each (day, hour) within operating hours
  const cellMap = new Map<string, UtilizationCell>();

  for (const [day, range] of Object.entries(hours)) {
    const dayNum = Number(day);
    for (let hour = range.start; hour < range.end; hour++) {
      const key = `${dayNum}-${hour}`;
      cellMap.set(key, {
        day: dayNum,
        hour,
        bookingCount: 0,
        bookedMinutes: 0,
        availableMinutes: 0,
        utilizationPct: 0,
        revenue: 0,
        revenuePerHour: 0,
      });
    }
  }

  // Assign completed bookings to their start hour cell
  for (const row of completed) {
    const dayIdx = getDayIndex(row.date);
    const hour = getHour(row.time);
    const key = `${dayIdx}-${hour}`;
    const cell = cellMap.get(key);
    if (cell) {
      cell.bookingCount++;
      cell.bookedMinutes += row.duration;
      cell.revenue += row.price;
    }
  }

  // Calculate available minutes and utilization for each cell
  let totalBooked = 0;
  let totalAvailable = 0;

  for (const cell of cellMap.values()) {
    const weekCount = dayOccurrences.get(cell.day)?.size ?? 0;
    cell.availableMinutes = weekCount * 60;
    if (cell.availableMinutes > 0) {
      cell.utilizationPct = Math.min(100, (cell.bookedMinutes / cell.availableMinutes) * 100);
      cell.revenuePerHour = cell.revenue / weekCount;
    }
    totalBooked += cell.bookedMinutes;
    totalAvailable += cell.availableMinutes;
  }

  const cells = Array.from(cellMap.values()).sort((a, b) =>
    a.day !== b.day ? a.day - b.day : a.hour - b.hour,
  );

  const overallUtilization = totalAvailable > 0 ? (totalBooked / totalAvailable) * 100 : 0;
  const deadZones = cells.filter((c) => c.availableMinutes > 0 && c.utilizationPct < 25);
  const peakZones = cells.filter((c) => c.utilizationPct > 80);

  return {
    cells,
    overallUtilization,
    deadZones,
    peakZones,
    operatingHours: hours,
  };
}
