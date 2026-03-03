import Papa from 'papaparse';

export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  errors: Papa.ParseError[];
}

/**
 * Parse a CSV string into headers and rows using PapaParse.
 * Uses worker:false (PapaParse web workers don't work in Electron with contextIsolation).
 * Handles BOM (byte order mark) in the input.
 */
export function parseBookingCsv(
  text: string,
  onProgress?: (progress: number) => void,
): CsvParseResult {
  // Strip BOM if present
  const cleaned = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true,
    worker: false,
  });

  onProgress?.(100);

  return {
    headers: result.meta.fields ?? [],
    rows: result.data,
    rowCount: result.data.length,
    errors: result.errors,
  };
}
