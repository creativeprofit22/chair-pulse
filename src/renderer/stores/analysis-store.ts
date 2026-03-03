import { create } from 'zustand';
import type { FullAnalysisReport } from '../../core/types/analysis';

export type AnalysisStatus = 'idle' | 'running' | 'complete' | 'error';

interface AnalysisState {
  status: AnalysisStatus;
  progress: number;
  report: FullAnalysisReport | null;
  error: string | null;
  selectedPeriod: 'all' | '7d' | '30d' | '90d' | '1y';

  setStatus: (status: AnalysisStatus) => void;
  setProgress: (progress: number) => void;
  setReport: (report: FullAnalysisReport) => void;
  setError: (error: string) => void;
  setSelectedPeriod: (period: 'all' | '7d' | '30d' | '90d' | '1y') => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  status: 'idle',
  progress: 0,
  report: null,
  error: null,
  selectedPeriod: 'all',

  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setReport: (report) => set({ report, status: 'complete', progress: 100 }),
  setError: (error) => set({ error, status: 'error' }),
  setSelectedPeriod: (selectedPeriod) => set({ selectedPeriod }),
  reset: () =>
    set({
      status: 'idle',
      progress: 0,
      report: null,
      error: null,
      selectedPeriod: 'all',
    }),
}));
