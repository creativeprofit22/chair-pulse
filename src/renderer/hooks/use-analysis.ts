import { useCallback, useEffect } from 'react';
import { useAnalysisStore } from '../stores/analysis-store';
import { useDataStore } from '../stores/data-store';

export function useAnalysis() {
  const { status, progress, report, error, setStatus, setProgress, setReport, setError, reset } =
    useAnalysisStore();
  const importedData = useDataStore((s) => s.importedData);

  // Listen for progress updates from main process
  useEffect(() => {
    const cleanup = window.electronAPI.onAnalysisProgress((prog: number) => {
      setProgress(prog);
    });
    return cleanup;
  }, [setProgress]);

  const runAnalysis = useCallback(async () => {
    if (importedData.length === 0) return;

    try {
      setStatus('running');
      setProgress(0);

      const result = await window.electronAPI.runAnalysis(importedData);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    }
  }, [importedData, setStatus, setProgress, setReport, setError]);

  return { status, progress, report, error, runAnalysis, reset };
}
