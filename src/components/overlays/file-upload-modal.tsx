import * as React from 'react';
import { Upload, FileText, Plus, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './dialog';

/**
 * FileUploadModal — multi-step file upload flow as a single composed modal.
 *
 * Four states driven by `step`:
 *   'select'    → drag-and-drop zone, click to pick files
 *   'selected'  → list of selected files with validation + Process button
 *   'uploading' → spinners while the upload runs
 *   'complete'  → success summary with finish action
 *
 * Promoted from inbound-outbound (QuoteConverter, ManualUploadModal),
 * smart-comparator (AcknowledgementUploadModal), quote-converter (the
 * deployed app). Each consumer was duplicating ~200 LOC of the same pattern.
 *
 * Controlled component: parent owns `step`, `files`, validation, and callbacks.
 * Pass `validate(file)` to mark error files inline (returns null when valid).
 */

export type FileUploadStep = 'select' | 'selected' | 'uploading' | 'complete';

export interface FileUploadModalProps {
  /** Whether the modal is visible. */
  open: boolean;
  /** Current step in the upload flow. */
  step: FileUploadStep;
  /** Files currently being processed. */
  files: File[];
  /** Optional per-file validator. Returns an error message or `null`. */
  validate?: (file: File) => string | null;
  /** File types to accept in the picker. Default `.pdf,application/pdf`. */
  accept?: string;
  /** Allow multiple files in one batch. Default true. */
  multiple?: boolean;
  /** Title text for the 'select' step. */
  selectTitle?: string;
  /** Subtitle text for the 'select' step. */
  selectSubtitle?: string;
  /** Verb used when describing each item (default 'Document'). */
  itemNoun?: string;

  onClose: () => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onStartUpload: () => void;
  onFinish: () => void;
  /** Called when the user clicks "Upload More" on the complete step. */
  onUploadMore?: () => void;
}

export function FileUploadModal({
  open,
  step,
  files,
  validate,
  accept = '.pdf,application/pdf',
  multiple = true,
  selectTitle = 'Upload Documents',
  selectSubtitle = 'PDF files up to 10MB each',
  itemNoun = 'Document',
  onClose,
  onAddFiles,
  onRemoveFile,
  onStartUpload,
  onFinish,
  onUploadMore,
}: FileUploadModalProps) {
  const fileError = React.useCallback(
    (f: File) => (validate ? validate(f) : null),
    [validate],
  );
  const validFiles = React.useMemo(
    () => files.filter((f) => fileError(f) === null),
    [files, fileError],
  );
  const validCount = validFiles.length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Hidden but required for a11y; replaced visually per step. */}
        <DialogTitle className="sr-only">{selectTitle}</DialogTitle>
        <DialogDescription className="sr-only">{selectSubtitle}</DialogDescription>

        {step === 'select' && (
          <SelectStep
            accept={accept}
            multiple={multiple}
            title={selectTitle}
            subtitle={selectSubtitle}
            onClose={onClose}
            onAddFiles={onAddFiles}
          />
        )}

        {step === 'selected' && (
          <SelectedStep
            files={files}
            validCount={validCount}
            accept={accept}
            multiple={multiple}
            itemNoun={itemNoun}
            fileError={fileError}
            onClose={onClose}
            onAddFiles={onAddFiles}
            onRemoveFile={onRemoveFile}
            onStartUpload={onStartUpload}
          />
        )}

        {step === 'uploading' && (
          <UploadingStep files={validFiles} itemNoun={itemNoun} />
        )}

        {step === 'complete' && (
          <CompleteStep
            files={validFiles}
            validCount={validCount}
            itemNoun={itemNoun}
            onUploadMore={onUploadMore}
            onFinish={onFinish}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose?: () => void;
}) {
  return (
    <div className="px-5 py-3 border-b border-border bg-card flex items-start justify-between gap-3 shrink-0">
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 h-7 w-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function SelectStep({
  accept,
  multiple,
  title,
  subtitle,
  onClose,
  onAddFiles,
}: {
  accept: string;
  multiple: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  onAddFiles: (files: File[]) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  return (
    <>
      <ModalHeader title={title} subtitle={subtitle} onClose={onClose} />
      <div className="p-5">
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer?.files) onAddFiles([...e.dataTransfer.files]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 cursor-pointer transition-colors select-none',
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-muted/40',
          )}
        >
          <Upload className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Drop files here or{' '}
              <span className="underline decoration-dotted">click to select</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={(e) => e.target.files && onAddFiles([...e.target.files])}
          />
        </div>
      </div>
    </>
  );
}

function SelectedStep({
  files,
  validCount,
  accept,
  multiple,
  itemNoun,
  fileError,
  onClose,
  onAddFiles,
  onRemoveFile,
  onStartUpload,
}: {
  files: File[];
  validCount: number;
  accept: string;
  multiple: boolean;
  itemNoun: string;
  fileError: (f: File) => string | null;
  onClose: () => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onStartUpload: () => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <ModalHeader
        title={`${files.length} File${files.length === 1 ? '' : 's'} Selected`}
        subtitle="Review files before processing"
        onClose={onClose}
      />
      <div className="p-5 space-y-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md text-xs font-semibold bg-card border border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add more files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && onAddFiles([...e.target.files])}
        />
        <ul className="space-y-2 max-h-[260px] overflow-y-auto">
          {files.map((file, i) => {
            const err = fileError(file);
            return (
              <li
                key={`${file.name}-${i}`}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2',
                  err
                    ? 'bg-destructive/5 border-destructive/20'
                    : 'bg-card border-border',
                )}
              >
                <FileText
                  className={cn(
                    'w-4 h-4 shrink-0',
                    err ? 'text-destructive' : 'text-muted-foreground',
                  )}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'text-sm truncate',
                      err ? 'text-destructive' : 'text-foreground',
                    )}
                  >
                    {file.name}
                  </div>
                  {err && (
                    <div className="text-[11px] text-destructive">{err}</div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveFile(i)}
                  className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center h-9 px-4 rounded-md text-[12px] font-semibold bg-card border border-border text-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onStartUpload}
          disabled={validCount === 0}
          className="inline-flex items-center justify-center h-9 px-4 rounded-md text-[12px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Process {validCount} {itemNoun}
          {validCount === 1 ? '' : 's'}
        </button>
      </div>
    </>
  );
}

function UploadingStep({ files, itemNoun }: { files: File[]; itemNoun: string }) {
  return (
    <>
      <div className="px-5 py-3 border-b border-border bg-card shrink-0">
        <h3 className="text-sm font-bold text-foreground">
          Uploading {files.length} {itemNoun}
          {files.length === 1 ? '' : 's'}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Uploading files…</p>
      </div>
      <div className="p-5">
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <FileText
                className="w-4 h-4 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <span className="flex-1 text-sm text-foreground truncate">
                {file.name}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <span className="w-3 h-3 rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground animate-spin" />
                Uploading…
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function CompleteStep({
  files,
  validCount,
  itemNoun,
  onUploadMore,
  onFinish,
}: {
  files: File[];
  validCount: number;
  itemNoun: string;
  onUploadMore?: () => void;
  onFinish: () => void;
}) {
  return (
    <>
      <div className="px-5 py-3 border-b border-border bg-card shrink-0">
        <h3 className="text-sm font-bold text-foreground">Upload Complete</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Files have been processed
        </p>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="h-14 w-14 rounded-full bg-status-success/15 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-status-success" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold text-foreground">
            {validCount} {itemNoun}
            {validCount === 1 ? '' : 's'} uploaded successfully
          </p>
        </div>
        <ul className="space-y-2 max-h-[180px] overflow-y-auto">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-status-success/20 bg-status-success/5 px-3 py-2"
            >
              <CheckCircle2
                className="w-4 h-4 text-status-success shrink-0"
                aria-hidden="true"
              />
              <span className="flex-1 text-sm text-foreground truncate">
                {file.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0">
        {onUploadMore && (
          <button
            type="button"
            onClick={onUploadMore}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md text-[12px] font-semibold bg-card border border-border text-foreground hover:bg-muted transition-colors"
          >
            Upload More
          </button>
        )}
        <button
          type="button"
          onClick={onFinish}
          className="inline-flex items-center justify-center h-9 px-4 rounded-md text-[12px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Done
        </button>
      </div>
    </>
  );
}
