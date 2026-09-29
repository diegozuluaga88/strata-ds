import * as React from 'react';
import { Button } from '@/components/application-ui/button';
import { Checkbox } from '@/components/forms/checkbox';
import { Label } from '@/components/application-ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/overlays/dialog';
import { getEditRenderer } from '../editors/registry';
import type { ColumnDefinition, HierarchicalData } from '../types';

export interface BulkEditDialogProps<TData extends HierarchicalData<TData>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editable columns only — the caller filters. */
  columns: ColumnDefinition<TData>[];
  /** A row used to resolve the editor type when the column does not declare one. */
  sampleRow?: TData;
  targetCount: number;
  onApply: (patch: Record<string, unknown>) => void | Promise<void>;
}

/**
 * Orderbahn's BulkEditDialog: tick the fields to change, set one value each, apply to the
 * whole selection. Field semantics come from `editors/registry`, so this file holds no
 * domain knowledge — a column with an `editRenderer` gets its own editor here too.
 */
export function BulkEditDialog<TData extends HierarchicalData<TData>>({
  open,
  onOpenChange,
  columns,
  sampleRow,
  targetCount,
  onApply,
}: BulkEditDialogProps<TData>) {
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>({});
  const [values, setValues] = React.useState<Record<string, unknown>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setEnabled({});
      setValues({});
      setError(null);
    }
  }, [open]);

  const patch = Object.fromEntries(
    Object.entries(enabled)
      .filter(([, isOn]) => isOn)
      .map(([field]) => [field, values[field]])
      // Defensive: only fields the live `columns` prop still shows a row for.
      .filter(([field]) => columns.some(c => c.field === field)),
  );
  // A ticked field with no explicit value yet (never touched its editor) has
  // `values[field] === undefined` — block Apply until it's resolved, so the sent
  // patch always matches what's visibly on screen.
  const hasUntouchedField = Object.values(patch).some(v => v === undefined);

  const handleApply = async () => {
    setBusy(true);
    setError(null);
    try {
      await Promise.resolve(onApply(patch));
      onOpenChange(false);
    } catch (error) {
      console.error('[BulkEditDialog] onApply failed:', error);
      setError('Bulk edit failed — try again');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-label="Bulk edit">
        <DialogHeader>
          <DialogTitle>Bulk edit</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {columns.map(column => {
            const Editor = getEditRenderer(column, sampleRow ? (sampleRow as Record<string, unknown>)[column.field] : undefined);
            const isOn = !!enabled[column.field];
            return (
              <div key={column.field} className="flex items-start gap-2">
                <Checkbox
                  id={`bulk-${column.field}`}
                  aria-label={`Change ${column.headerText}`}
                  checked={isOn}
                  onCheckedChange={checked => {
                    setEnabled(prev => ({ ...prev, [column.field]: checked === true }));
                    // Unticking must drop any buffered value — otherwise re-ticking
                    // resurrects a stale choice with no sign it isn't fresh.
                    if (checked !== true) {
                      setValues(prev => {
                        const { [column.field]: _drop, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`bulk-${column.field}`}>{column.headerText}</Label>
                  {isOn && (
                    <Editor
                      value={values[column.field]}
                      row={(sampleRow ?? ({} as TData))}
                      column={column}
                      onChange={value => setValues(prev => ({ ...prev, [column.field]: value }))}
                      onCommit={() => undefined}
                      onCancel={() => undefined}
                    />
                  )}
                </div>
              </div>
            );
          })}
          {columns.length === 0 && (
            <p className="text-sm text-muted-foreground">No editable columns in this grid.</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleApply()}
            disabled={busy || Object.keys(patch).length === 0 || hasUntouchedField}
          >
            Apply to {targetCount} {targetCount === 1 ? 'record' : 'records'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
