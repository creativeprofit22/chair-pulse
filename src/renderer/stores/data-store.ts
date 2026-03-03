import { create } from 'zustand';
import type { BookingRow, DataQualityReport } from '../../core/types/booking';
import type { BookingSystem } from '../../core/types/booking';

export type ImportStatus = 'idle' | 'importing' | 'mapping' | 'ready' | 'error';

interface ImportFile {
  name: string;
  size: number;
}

interface DataState {
  importedData: BookingRow[];
  rawHeaders: string[];
  rowCount: number;
  detectedSystem: BookingSystem | null;
  importStatus: ImportStatus;
  importFile: ImportFile | null;
  importError: string | null;
  columnMapping: Record<string, string> | null;
  qualityReport: DataQualityReport | null;

  setRawHeaders: (headers: string[]) => void;
  setDetectedSystem: (system: BookingSystem) => void;
  setImportStatus: (status: ImportStatus) => void;
  setImportFile: (file: ImportFile) => void;
  setImportError: (error: string | null) => void;
  setColumnMapping: (mapping: Record<string, string>) => void;
  setImportedData: (data: BookingRow[], report: DataQualityReport) => void;
  reset: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  importedData: [],
  rawHeaders: [],
  rowCount: 0,
  detectedSystem: null,
  importStatus: 'idle',
  importFile: null,
  importError: null,
  columnMapping: null,
  qualityReport: null,

  setRawHeaders: (headers) => set({ rawHeaders: headers }),
  setDetectedSystem: (system) => set({ detectedSystem: system }),
  setImportStatus: (status) => set({ importStatus: status }),
  setImportFile: (file) => set({ importFile: file }),
  setImportError: (error) => set({ importError: error, importStatus: error ? 'error' : 'idle' }),
  setColumnMapping: (mapping) => set({ columnMapping: mapping }),
  setImportedData: (data, report) =>
    set({
      importedData: data,
      rowCount: data.length,
      qualityReport: report,
      importStatus: 'ready',
    }),
  reset: () =>
    set({
      importedData: [],
      rawHeaders: [],
      rowCount: 0,
      detectedSystem: null,
      importStatus: 'idle',
      importFile: null,
      importError: null,
      columnMapping: null,
      qualityReport: null,
    }),
}));
