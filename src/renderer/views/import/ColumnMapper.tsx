import { useCallback } from 'react';
import { BOOKING_IMPORT_FIELDS } from '../../../core/parsers/column-mapper';
import type { BookingSystem } from '../../../core/types/booking';

const SYSTEM_LABELS: Record<string, string> = {
  fresha: 'Fresha',
  booksy: 'Booksy',
  square: 'Square',
  timely: 'Timely',
  generic: 'Generic CSV',
};

interface ColumnMapperProps {
  headers: string[];
  mapping: Record<string, string>;
  detectedSystem: BookingSystem | null;
  onMappingChange: (mapping: Record<string, string>) => void;
}

export default function ColumnMapper({
  headers,
  mapping,
  detectedSystem,
  onMappingChange,
}: ColumnMapperProps) {
  const handleFieldChange = useCallback(
    (fieldId: string, csvHeader: string) => {
      onMappingChange({ ...mapping, [fieldId]: csvHeader });
    },
    [mapping, onMappingChange],
  );

  return (
    <div>
      {detectedSystem && (
        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: 'var(--accent-muted)',
            color: 'var(--accent)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          Detected: {SYSTEM_LABELS[detectedSystem] ?? detectedSystem}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        {BOOKING_IMPORT_FIELDS.map((field) => (
          <div
            key={field.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <label
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
              }}
            >
              {field.label}
              {field.required && (
                <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>
              )}
            </label>
            <select
              value={mapping[field.id] ?? '__skip'}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              style={{
                padding: '8px 10px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
              }}
            >
              <option value="__skip">— Skip —</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
