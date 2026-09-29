import { useCallback, useRef, useState } from 'react';
import { Button } from '../button';
import { cn } from '@/utils';
import { FileSpreadsheet, FileText, FileUp, X } from 'lucide-react';

const ACCEPT = '.pdf,.csv,.xlsx';
const ALLOWED_EXTENSIONS = /\.(pdf|csv|xlsx)$/i;

function isAllowedFile(file: File): boolean {
  return ALLOWED_EXTENSIONS.test(file.name);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeIcon(file: File): React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }> {
  if (/\.pdf$/i.test(file.name)) return FileText;
  return FileSpreadsheet;
}

export interface OrderFileDropzoneProps {
  value: File | null;
  onChange: (file: File | null) => void;
  className?: string;
}

export function OrderFileDropzone({
  value,
  onChange,
  className,
}: OrderFileDropzoneProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateAndSet = useCallback(
    (file: File | null) => {
      if (!file) {
        onChange(null);
        return;
      }
      if (!isAllowedFile(file)) {
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
      onChange(file);
    },
    [onChange],
  );

  const handleDropzoneClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      validateAndSet(file);
      if (inputRef.current) inputRef.current.value = '';
    },
    [validateAndSet],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0] ?? null;
      validateAndSet(file ?? null);
      if (inputRef.current) inputRef.current.value = '';
    },
    [validateAndSet],
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [onChange]);

  const hasFile = value !== null;

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden
      />
      {!hasFile ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Click to upload or drag and drop file"
          onClick={handleDropzoneClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDropzoneClick();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'min-h-[440px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 p-4 cursor-pointer transition-colors',
            'border-brand-700 dark:border-brand-500 bg-brand-700/5 dark:bg-brand-500/5 hover:border-primary/50',
            isDragging && 'border-primary',
          )}
        >
          <FileUp className="h-8 w-8 text-brand-700 dark:text-brand-500" aria-hidden />
          <span className="text-sm text-foreground text-center">
            Drag & Drop your file here or browse files
          </span>
          <span className="text-xs text-muted-foreground text-center">
            Supports PDF orders, Excel spreadsheets (.xlsx), and CSV files.
            We&apos;ll automatically extract line items.
          </span>
          <Button
            type="button"
            variant="default"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleDropzoneClick();
            }}
          >
            Select Files
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-border bg-card">
          {(() => {
            const Icon = getFileTypeIcon(value);
            return (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30">
                <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
              </div>
            );
          })()}
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm font-medium text-foreground truncate" title={value.name}>
              {value.name}
            </p>
            <p className="text-xs text-muted-foreground">{formatFileSize(value.size)}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRemove}
            className="shrink-0 cursor-pointer"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}
