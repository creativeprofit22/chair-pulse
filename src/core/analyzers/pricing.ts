import type { BookingRow } from '../types/booking';
import { BookingStatus } from '../types/booking';
import type { UtilizationAnalysis, PricingAnalysis, PricingSlot } from '../types/analysis';

const SLOT_RANGES: { label: string; startHour: number; endHour: number }[] = [
  { label: 'Morning (9-12)', startHour: 9, endHour: 12 },
  { label: 'Afternoon (12-16)', startHour: 12, endHour: 16 },
  { label: 'Evening (16-19)', startHour: 16, endHour: 19 },
];

function getHour(time: string): number {
  return parseInt(time.split(':')[0], 10);
}

export function analyzePricing(
  rows: BookingRow[],
  utilization: UtilizationAnalysis,
  offPeakDiscount = 0.15,
  peakPremium = 0.1,
): PricingAnalysis {
  const completed = rows.filter((r) => r.status === BookingStatus.COMPLETED);

  // Calculate average utilization per time slot
  const slotUtilization = SLOT_RANGES.map((range) => {
    const cells = utilization.cells.filter(
      (c) => c.hour >= range.startHour && c.hour < range.endHour,
    );
    const totalUtil = cells.reduce((sum, c) => sum + c.utilizationPct, 0);
    const avgUtil = cells.length > 0 ? totalUtil / cells.length : 0;
    return { ...range, avgUtil };
  });

  // Calculate actual revenue per time slot
  const slotRevenue = SLOT_RANGES.map((range) => {
    const slotBookings = completed.filter((r) => {
      const hour = getHour(r.time);
      return hour >= range.startHour && hour < range.endHour;
    });
    return slotBookings.reduce((sum, r) => sum + r.price, 0);
  });

  const slots: PricingSlot[] = slotUtilization.map((slot, i) => {
    const currentRevenue = slotRevenue[i];
    const isPeak = slot.avgUtil > 70;
    const isOffPeak = slot.avgUtil < 40;

    let suggestedRevenue = currentRevenue;
    if (isPeak) {
      suggestedRevenue = currentRevenue * (1 + peakPremium);
    } else if (isOffPeak) {
      // Discount price but model 1.4x more bookings from increased demand
      suggestedRevenue = currentRevenue * (1 - offPeakDiscount) * 1.4;
    }

    return {
      label: slot.label,
      currentRevenue,
      suggestedRevenue,
      isPeak,
      utilizationPct: slot.avgUtil,
    };
  });

  const currentTotal = slots.reduce((sum, s) => sum + s.currentRevenue, 0);
  const projectedTotal = slots.reduce((sum, s) => sum + s.suggestedRevenue, 0);

  return {
    slots,
    offPeakDiscount,
    peakPremium,
    currentTotal,
    projectedTotal,
    revenueImpact: projectedTotal - currentTotal,
  };
}
