import { parentPort } from 'worker_threads';
import { runFullAnalysis, type AnalysisConfig } from '../../core/analyzers/index';
import type { BookingRow } from '../../core/types/booking';

function reviveDates(rows: unknown[]): BookingRow[] {
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      ...r,
      date: new Date(r.date as string | number),
    } as BookingRow;
  });
}

parentPort?.on('message', (msg: { type: string; rows: unknown[]; config?: AnalysisConfig }) => {
  if (msg.type === 'run') {
    try {
      parentPort?.postMessage({ type: 'progress', progress: 10 });

      const rows = reviveDates(msg.rows);
      parentPort?.postMessage({ type: 'progress', progress: 30 });

      const result = runFullAnalysis(rows, msg.config);
      parentPort?.postMessage({ type: 'progress', progress: 100 });

      parentPort?.postMessage({ type: 'result', data: result });
    } catch (err) {
      parentPort?.postMessage({
        type: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
});
