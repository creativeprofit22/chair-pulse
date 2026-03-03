import type { BookingRow } from '../types/booking';
import { BookingStatus } from '../types/booking';
import type { ServiceMixAnalysis, ServiceMixEntry } from '../types/analysis';

export function analyzeServiceMix(rows: BookingRow[]): ServiceMixAnalysis {
  const completed = rows.filter((r) => r.status === BookingStatus.COMPLETED);

  const totalRevenue = completed.reduce((sum, r) => sum + r.price, 0);

  const serviceMap = new Map<string, { count: number; revenue: number; totalDuration: number }>();

  for (const row of completed) {
    let entry = serviceMap.get(row.service);
    if (!entry) {
      entry = { count: 0, revenue: 0, totalDuration: 0 };
      serviceMap.set(row.service, entry);
    }
    entry.count++;
    entry.revenue += row.price;
    entry.totalDuration += row.duration;
  }

  const services: ServiceMixEntry[] = Array.from(serviceMap.entries()).map(([service, data]) => {
    const avgDurationMins = data.count > 0 ? data.totalDuration / data.count : 0;
    const totalHours = data.totalDuration / 60;
    const revenuePerHour = totalHours > 0 ? data.revenue / totalHours : 0;
    const revenueSharePct = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;

    return {
      service,
      bookingCount: data.count,
      totalRevenue: data.revenue,
      avgDurationMins,
      revenuePerHour,
      revenueSharePct,
    };
  });

  // Sort by revenuePerHour descending
  services.sort((a, b) => b.revenuePerHour - a.revenuePerHour);

  return {
    services,
    totalServices: services.length,
  };
}
