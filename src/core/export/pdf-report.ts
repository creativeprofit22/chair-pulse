import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FullAnalysisReport } from '../types/analysis';
import type { AIInsightsReport } from '../types/ai';

function getTableEndY(doc: jsPDF): number {
  // jspdf-autotable stores the last table position on the doc instance
  const lastTable = (doc as unknown as Record<string, { finalY?: number }>).lastAutoTable;
  return lastTable?.finalY ?? 60;
}

export function generatePdfReport(
  report: FullAnalysisReport,
  insights?: AIInsightsReport,
): ArrayBuffer {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(24);
  doc.text('Chair Pulse Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  doc.text(`Bookings analyzed: ${report.bookingCount}`, 14, 34);

  // Health Score
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(`Health Score: ${report.health.overall}/100`, 14, 48);

  // KPIs Table
  doc.setFontSize(12);
  doc.text('Key Metrics', 14, 60);

  autoTable(doc, {
    startY: 64,
    head: [['Metric', 'Value']],
    body: [
      ['No-Show Rate', `${(report.noShow.noShowRate * 100).toFixed(1)}%`],
      ['Revenue Lost', `\u00A3${report.noShow.revenueLost.toFixed(0)}`],
      ['Chair Utilization', `${report.utilization.overallUtilization.toFixed(1)}%`],
      ['Revenue / Hour', `\u00A3${report.revenue.avgPerHour.toFixed(0)}`],
      ['Total Revenue', `\u00A3${report.revenue.total.toFixed(0)}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [108, 92, 231] },
  });

  // Service Mix Table
  let y = getTableEndY(doc) + 12;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Service Mix', 14, y);

  autoTable(doc, {
    startY: y + 4,
    head: [['Service', 'Bookings', 'Revenue', '\u00A3/hr', 'Share']],
    body: report.serviceMix.services.map((s) => [
      s.service,
      String(s.bookingCount),
      `\u00A3${s.totalRevenue.toFixed(0)}`,
      `\u00A3${s.revenuePerHour.toFixed(0)}`,
      `${s.revenueSharePct.toFixed(1)}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [108, 92, 231] },
  });

  // Top Actions
  y = getTableEndY(doc) + 12;
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Top Actions', 14, y);

  autoTable(doc, {
    startY: y + 4,
    head: [['Priority', 'Action', 'Est. Impact']],
    body: report.health.topActions.map((a) => [
      a.priority.toUpperCase(),
      `${a.title}\n${a.description}`,
      `+\u00A3${Math.round(a.estimatedImpact).toLocaleString()}`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [108, 92, 231] },
    columnStyles: { 1: { cellWidth: 120 } },
  });

  // AI Recommendations
  if (insights) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('AI Recommendations', 14, 20);

    let recY = 30;

    // Action Plan Summary
    if (insights.actionPlan.summary) {
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const summaryLines = doc.splitTextToSize(insights.actionPlan.summary, 180);
      doc.text(summaryLines as string[], 14, recY);
      recY += (summaryLines as string[]).length * 5 + 8;
    }

    for (const rec of insights.actionPlan.recommendations) {
      if (recY > 260) {
        doc.addPage();
        recY = 20;
      }

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`[${rec.urgency.toUpperCase()}] ${rec.title}`, 14, recY);
      recY += 6;

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(rec.description, 180);
      doc.text(lines as string[], 14, recY);
      recY += (lines as string[]).length * 4.5 + 4;

      doc.setTextColor(0, 150, 0);
      doc.text(`Estimated impact: +\u00A3${rec.estimatedImpact}`, 14, recY);
      recY += 10;
    }
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Built by Douro Digital \u2014 wearedouro.agency', 14, 287);
    doc.text(`Page ${i} of ${pageCount}`, 186, 287);
  }

  return doc.output('arraybuffer');
}
