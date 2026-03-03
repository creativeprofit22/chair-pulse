import type { BookingRow } from '../types/booking';
import type { FullAnalysisReport } from '../types/analysis';
import { analyzeNoShows } from './no-show';
import { analyzeUtilization } from './utilization';
import { analyzeRevenue } from './revenue';
import { analyzeServiceMix } from './service-mix';
import { analyzePricing } from './pricing';
import { calculateHealthScore } from './health-score';

export interface AnalysisConfig {
  operatingHours?: Record<number, { start: number; end: number }>;
  offPeakDiscount?: number;
  peakPremium?: number;
}

export function runFullAnalysis(rows: BookingRow[], config?: AnalysisConfig): FullAnalysisReport {
  const noShow = analyzeNoShows(rows);
  const utilization = analyzeUtilization(rows, config?.operatingHours);
  const revenue = analyzeRevenue(rows);
  const serviceMix = analyzeServiceMix(rows);
  const pricing = analyzePricing(rows, utilization, config?.offPeakDiscount, config?.peakPremium);
  const health = calculateHealthScore(noShow, utilization, revenue, serviceMix);

  // Calculate date range
  const dates = rows.map((r) => r.date.getTime());
  const start = new Date(Math.min(...dates));
  const end = new Date(Math.max(...dates));

  return {
    noShow,
    utilization,
    revenue,
    serviceMix,
    pricing,
    health,
    generatedAt: new Date(),
    bookingCount: rows.length,
    dateRange: { start, end },
  };
}
