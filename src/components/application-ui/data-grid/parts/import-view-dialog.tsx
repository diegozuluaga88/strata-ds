import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/overlays/dialog';
import { AlertCircle, Upload } from 'lucide-react';
import { cn } from '@/utils';

const MAX_FILE_BYTES = 1024 * 1024; // 1 MB

export interface ImportViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "Acknowledgements" -- rendered as "The file has to be for Acknowledgements".
   * Omit for a generic subtitle when the caller has no specific entity name to show. */
  entityLabel?: string;
  /** Called with the file's text content once it passes validation. This dialog never
   * parses or persists it -- that stays the app's job, same boundary as before. */
  onImportFile: (content: string) => void;
}

// .stratagrid.json is itself a .json file, so this single check already covers both --
// the extension is a naming convention for this export, not a distinct format.
function isAcceptedFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.json');
}

/**
 * "Import a view" modal: drag & drop or click-to-browse a single `.stratagrid.json`
 * file, validated client-side (extension + 1 MB cap) before it's ever read.
 */
export function ImportViewDialog({ open, onOpenChange, entityLabel, onImportFile }: ImportViewDialogProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Otherwise a validation error from a prior attempt is still on screen the next time
  // this dialog opens, before the user has touched anything this time around.
  React.useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  const handleFile = (file: File) => {
    setError(null);
    if (!isAcceptedFile(file)) {
      setError('The file must be a .json or .stratagrid.json file.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('The file is too large -- up to 1 MB is supported.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onImportFile(String(reader.result ?? ''));
    reader.onerror = () => setError('The selected file could not be read. Please try again.');
    reader.readAsText(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) handleFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import a view</DialogTitle>
          <DialogDescription>
            {entityLabel ? `The file has to be for ${entityLabel}` : 'The file must be a .stratagrid.json export from this grid.'}
          </DialogDescription>
        </DialogHeader>
        <div
          data-testid="import-view-dropzone"
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
          }}
          onDragOver={event => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            isDragOver ? 'border-brand-500 bg-brand-50' : 'border-border',
          )}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drop a .stratagrid.json file or{' '}
            <label htmlFor="import-view-file-input" className="cursor-pointer text-brand-700 underline">
              click to browse
            </label>
          </p>
          <p className="text-xs text-muted-foreground">One .json or .stratagrid.json file, max 1 MB</p>
          <input
            ref={inputRef}
            id="import-view-file-input"
            type="file"
            accept=".json,.stratagrid.json,application/json"
            aria-label="Drop a .stratagrid.json file or click to browse"
            className="sr-only"
            // Out of the tab order: the wrapping `role="button"` div is the one keyboard
            // target. Without this, the input is independently focusable and its own
            // Enter/Space activation would open the picker a second time on top of the
            // div's onKeyDown -- a real double-activation, not just a duplicate tab stop.
            tabIndex={-1}
            onClick={event => event.stopPropagation()}
            onChange={handleInputChange}
          />
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
