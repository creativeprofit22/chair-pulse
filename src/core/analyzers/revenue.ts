import type { BookingRow } from '../types/booking';
import { BookingStatus } from '../types/booking';
import type { RevenueAnalysis, RevenueDayBreakdown, RevenueWeekly } from '../types/analysis';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOT_LABELS = ['Morning', 'Afternoon', 'Evening'];

function getDayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function getHour(time: string): number {
  return parseInt(time.split(':')[0], 10);
}

function getTimeSlotIndex(hour: number): number {
  if (hour < 12) return 0;
  if (hour < 17) return 1;
  return 2;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Shift to Monday-based week
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function buildDayBreakdown(
  completed: BookingRow[],
  groupFn: (row: BookingRow) => number,
  labels: string[],
): RevenueDayBreakdown[] {
  const groups = new Map<number, { total: number; count: number; totalDuration: number }>();

  for (const row of completed) {
    const idx = groupFn(row);
    let g = groups.get(idx);
    if (!g) {
      g = { total: 0, count: 0, totalDuration: 0 };
      groups.set(idx, g);
    }
    g.total += row.price;
    g.count++;
    g.totalDuration += row.duration;
  }

  return labels.map((label, i) => {
    const g = groups.get(i);
    if (!g || g.count === 0) {
      return { label, total: 0, avgPerBooking: 0, avgPerHour: 0 };
    }
    return {
      label,
      total: g.total,
      avgPerBooking: g.total / g.count,
      avgPerHour: g.totalDuration > 0 ? g.total / (g.totalDuration / 60) : 0,
    };
  });
}

export function analyzeRevenue(rows: BookingRow[]): RevenueAnalysis {
  const completed = rows.filter((r) => r.status === BookingStatus.COMPLETED);

  const total = completed.reduce((sum, r) => sum + r.price, 0);
  const totalDuration = completed.reduce((sum, r) => sum + r.duration, 0);
  const avgPerBooking = completed.length > 0 ? total / completed.length : 0;
  const avgPerHour = totalDuration > 0 ? total / (totalDuration / 60) : 0;

  const byDayOfWeek = buildDayBreakdown(completed, (r) => getDayIndex(r.date), DAY_LABELS);

  const byTimeSlot = buildDayBreakdown(
    completed,
    (r) => getTimeSlotIndex(getHour(r.time)),
    TIME_SLOT_LABELS,
  );

  // Weekly trend
  const weekGroups = new Map<string, number>();
  for (const row of completed) {
    const weekKey = getWeekStart(row.date);
    weekGroups.set(weekKey, (weekGroups.get(weekKey) ?? 0) + row.price);
  }

  const weeklyTrend: RevenueWeekly[] = Array.from(weekGroups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, weekTotal]) => ({
      weekStart: new Date(weekStart),
      total: weekTotal,
    }));

  // Trend direction: compare last 2 weeks
  let trendDirection: 'up' | 'down' | 'flat' = 'flat';
  if (weeklyTrend.length >= 2) {
    const last = weeklyTrend[weeklyTrend.length - 1].total;
    const prev = weeklyTrend[weeklyTrend.length - 2].total;
    const change = prev > 0 ? (last - prev) / prev : 0;
    if (change > 0.05) trendDirection = 'up';
    else if (change < -0.05) trendDirection = 'down';
  }

  return {
    total,
    avgPerBooking,
    avgPerHour,
    byDayOfWeek,
    byTimeSlot,
    weeklyTrend,
    trendDirection,
  };
}
