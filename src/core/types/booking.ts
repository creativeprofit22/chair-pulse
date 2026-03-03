export enum BookingStatus {
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

export enum BookingSystem {
  FRESHA = 'fresha',
  BOOKSY = 'booksy',
  SQUARE = 'square',
  TIMELY = 'timely',
  GENERIC = 'generic',
}

export interface BookingRow {
  date: Date;
  time: string;
  service: string;
  duration: number; // minutes
  price: number;
  status: BookingStatus;
  staff: string;
  client?: string;
  depositPaid?: boolean;
}

export interface ImportFieldDefinition {
  id: string;
  label: string;
  required: boolean;
  aliases: readonly string[];
}

export interface ParsedBookingData {
  rows: BookingRow[];
  headers: string[];
  rowCount: number;
  system: BookingSystem;
  errors: ParseError[];
  quality: DataQualityReport;
}

export interface ParseError {
  row?: number;
  field?: string;
  message: string;
  type: 'warning' | 'error';
}

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  missingFields: Record<string, number>;
  warnings: string[];
}
