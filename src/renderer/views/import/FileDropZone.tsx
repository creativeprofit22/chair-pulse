import { useState, useCallback, type DragEvent } from 'react';

interface FileDropZoneProps {
  onFileContent: (content: string, fileName: string, fileSize: number) => void;
  disabled?: boolean;
}

export default function FileDropZone({ onFileContent, disabled }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && file.name.toLowerCase().endsWith('.csv')) {
        // Read file content directly — File.path is stripped by sandbox: true
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onFileContent(reader.result, file.name, file.size);
          }
        };
        reader.readAsText(file);
      }
    },
    [onFileContent, disabled],
  );

  const handleClick = useCallback(async () => {
    if (disabled) return;
    const filePath = await window.electronAPI.openFile();
    if (filePath) {
      const text = await window.electronAPI.readFile(filePath);
      const name = filePath.split(/[/\\]/).pop() ?? 'file.csv';
      onFileContent(text, name, new Blob([text]).size);
    }
  }, [onFileContent, disabled]);

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragOver ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '48px 24px',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: isDragOver ? 'var(--accent-muted)' : 'var(--bg-secondary)',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📁</div>
      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
        Drop your booking CSV here
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
        or click to browse. Supports Fresha, Booksy, Square, Timely, and generic CSV formats.
      </div>
    </div>
  );
}
