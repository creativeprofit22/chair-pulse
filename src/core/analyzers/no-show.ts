import type { BookingRow } from '../types/booking';
import { BookingStatus } from '../types/booking';
import type { NoShowAnalysis, NoShowBreakdown } from '../types/analysis';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_OF_DAY_LABELS = ['Morning', 'Afternoon', 'Evening'];

function getDayIndex(date: Date): number {
  return (date.getDay() + 6) % 7; // 0=Mon, 6=Sun
}

function getHour(time: string): number {
  return parseInt(time.split(':')[0], 10);
}

function getTimeOfDayIndex(hour: number): number {
  if (hour < 12) return 0; // Morning
  if (hour < 17) return 1; // Afternoon
  return 2; // Evening
}

function buildBreakdown(
  rows: BookingRow[],
  groupFn: (row: BookingRow) => string,
): NoShowBreakdown[] {
  const groups = new Map<string, { total: number; noShows: number; revenueLost: number }>();

  for (const row of rows) {
    const key = groupFn(row);
    let group = groups.get(key);
    if (!group) {
      group = { total: 0, noShows: 0, revenueLost: 0 };
      groups.set(key, group);
    }
    group.total++;
    if (row.status === BookingStatus.NO_SHOW) {
      group.noShows++;
      group.revenueLost += row.price;
    }
  }

  return Array.from(groups.entries()).map(([label, g]) => ({
    label,
    count: g.noShows,
    rate: g.total > 0 ? g.noShows / g.total : 0,
    revenueImpact: g.revenueLost,
  }));
}

export function analyzeNoShows(rows: BookingRow[]): NoShowAnalysis {
  const noShows = rows.filter((r) => r.status === BookingStatus.NO_SHOW);

  const totalBookings = rows.length;
  const noShowCount = noShows.length;
  const noShowRate = totalBookings > 0 ? noShowCount / totalBookings : 0;
  const revenueLost = noShows.reduce((sum, r) => sum + r.price, 0);

  const byDayOfWeek = buildBreakdown(rows, (r) => DAY_LABELS[getDayIndex(r.date)]);
  // Ensure all 7 days are present
  for (const label of DAY_LABELS) {
    if (!byDayOfWeek.some((b) => b.label === label)) {
      byDayOfWeek.push({ label, count: 0, rate: 0, revenueImpact: 0 });
    }
  }
  byDayOfWeek.sort((a, b) => DAY_LABELS.indexOf(a.label) - DAY_LABELS.indexOf(b.label));

  const byTimeOfDay = buildBreakdown(
    rows,
    (r) => TIME_OF_DAY_LABELS[getTimeOfDayIndex(getHour(r.time))],
  );
  for (const label of TIME_OF_DAY_LABELS) {
    if (!byTimeOfDay.some((b) => b.label === label)) {
      byTimeOfDay.push({ label, count: 0, rate: 0, revenueImpact: 0 });
    }
  }
  byTimeOfDay.sort(
    (a, b) => TIME_OF_DAY_LABELS.indexOf(a.label) - TIME_OF_DAY_LABELS.indexOf(b.label),
  );

  const byService = buildBreakdown(rows, (r) => r.service);
  byService.sort((a, b) => b.revenueImpact - a.revenueImpact);

  const byStaff = buildBreakdown(rows, (r) => r.staff);
  byStaff.sort((a, b) => b.revenueImpact - a.revenueImpact);

  const byDepositStatus = buildBreakdown(rows, (r) =>
    r.depositPaid ? 'With Deposit' : 'Without Deposit',
  );

  return {
    totalBookings,
    noShowCount,
    noShowRate,
    revenueLost,
    byDayOfWeek,
    byTimeOfDay,
    byService,
    byStaff,
    byDepositStatus,
  };
}
