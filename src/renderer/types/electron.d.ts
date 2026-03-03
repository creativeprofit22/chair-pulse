import type { AppSettings } from '../../main/settings/store';
import type { FullAnalysisReport } from '../../core/types/analysis';
import type { AIInsightsReport } from '../../core/types/ai';

export {};

declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      versions: {
        electron: string;
        node: string;
        chrome: string;
      };

      // File Operations
      openFile: () => Promise<string | null>;
      readFile: (filePath: string) => Promise<string>;

      // Settings
      loadSettings: () => Promise<AppSettings>;
      saveSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
      setApiKey: (provider: string, apiKey: string) => Promise<void>;
      hasApiKey: (provider: string) => Promise<boolean>;

      // Analysis
      runAnalysis: (rows: unknown[]) => Promise<FullAnalysisReport>;
      onAnalysisProgress: (callback: (progress: number) => void) => () => void;

      // AI
      testAIConnection: (
        provider: string,
        model: string,
        baseUrl: string,
      ) => Promise<{ ok: boolean; error?: string }>;
      generateInsights: (report: FullAnalysisReport) => Promise<AIInsightsReport>;

      // Export
      exportPdf: (
        report: FullAnalysisReport,
        insights: AIInsightsReport | null,
      ) => Promise<boolean>;
      exportCsv: (
        report: FullAnalysisReport,
        insights: AIInsightsReport | null,
      ) => Promise<boolean>;
    };
  }
}
