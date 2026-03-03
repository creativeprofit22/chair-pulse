export interface NoShowBreakdown {
  label: string;
  count: number;
  rate: number;
  revenueImpact: number;
}

export interface NoShowAnalysis {
  totalBookings: number;
  noShowCount: number;
  noShowRate: number;
  revenueLost: number;
  byDayOfWeek: NoShowBreakdown[];
  byTimeOfDay: NoShowBreakdown[];
  byService: NoShowBreakdown[];
  byStaff: NoShowBreakdown[];
  byDepositStatus: NoShowBreakdown[];
}

export interface UtilizationCell {
  day: number; // 0=Mon, 6=Sun
  hour: number;
  bookingCount: number;
  bookedMinutes: number;
  availableMinutes: number;
  utilizationPct: number;
  revenue: number;
  revenuePerHour: number;
}

export interface UtilizationAnalysis {
  cells: UtilizationCell[];
  overallUtilization: number;
  deadZones: UtilizationCell[];
  peakZones: UtilizationCell[];
  operatingHours: Record<number, { start: number; end: number }>;
}

export interface RevenueDayBreakdown {
  label: string;
  total: number;
  avgPerBooking: number;
  avgPerHour: number;
}

export interface RevenueWeekly {
  weekStart: Date;
  total: number;
}

export interface RevenueAnalysis {
  total: number;
  avgPerBooking: number;
  avgPerHour: number;
  byDayOfWeek: RevenueDayBreakdown[];
  byTimeSlot: RevenueDayBreakdown[];
  weeklyTrend: RevenueWeekly[];
  trendDirection: 'up' | 'down' | 'flat';
}

export interface ServiceMixEntry {
  service: string;
  bookingCount: number;
  totalRevenue: number;
  avgDurationMins: number;
  revenuePerHour: number;
  revenueSharePct: number;
}

export interface ServiceMixAnalysis {
  services: ServiceMixEntry[];
  totalServices: number;
}

export interface PricingSlot {
  label: string;
  currentRevenue: number;
  suggestedRevenue: number;
  isPeak: boolean;
  utilizationPct: number;
}

export interface PricingAnalysis {
  slots: PricingSlot[];
  offPeakDiscount: number;
  peakPremium: number;
  currentTotal: number;
  projectedTotal: number;
  revenueImpact: number;
}

export interface HealthSubScore {
  label: string;
  score: number;
  weight: number;
}

export interface ActionItem {
  title: string;
  description: string;
  category: 'no_show' | 'utilization' | 'revenue' | 'service_mix' | 'pricing';
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number;
}

export interface HealthScore {
  overall: number;
  subScores: HealthSubScore[];
  topActions: ActionItem[];
}

export interface FullAnalysisReport {
  noShow: NoShowAnalysis;
  utilization: UtilizationAnalysis;
  revenue: RevenueAnalysis;
  serviceMix: ServiceMixAnalysis;
  pricing: PricingAnalysis;
  health: HealthScore;
  generatedAt: Date;
  bookingCount: number;
  dateRange: { start: Date; end: Date };
}
