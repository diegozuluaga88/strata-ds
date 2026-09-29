import * as React from 'react';
import { Button } from '@/components/application-ui/button';
import { Input } from '@/components/forms/input';
import { Label } from '@/components/application-ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/overlays/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/overlays/dropdown-menu';
import { ConfirmDialog } from '@/components/overlays/confirm-dialog';
import { Badge } from '@/components/application-ui/badge';
import { AlertCircle, Check, ChevronDown, MoreHorizontal, Plus, Save, Undo2 } from 'lucide-react';
import { cn } from '@/utils';
import { dataGridToolbarPillClass } from './data-grid-toolbar';
import { ImportViewDialog } from './import-view-dialog';
import { downloadBrowserFile } from '../lib/exportUtils';
import type { PersistedGridState } from '../state/persisted-state';

export interface DataGridView<TData = any> {
  id: string;
  name: string;
  isDefault?: boolean;
  state: PersistedGridState<TData>;
}

export interface DataGridViewSelectorProps<TData = any> {
  views: DataGridView<TData>[];
  activeId: string | null;
  /** The current grid state differs from the active view's saved state. */
  hasUnsavedChanges?: boolean;
  onSelect: (id: string) => void;
  onSaveChanges?: (id: string) => void;
  onSaveAs?: (name: string) => void;
  onSetDefault?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  /**
   * The user asked to export the active view's configuration. Omit to hide the item.
   * Return the serialized content to download, or null/falsy to abort silently
   * (e.g. serialization failed). This component owns building and triggering the
   * `.stratagrid.json` file download from that string.
   */
  onExportView?: (id: string) => string | null;
  /**
   * The user picked or dropped a view file in the built-in Import dialog, and it read
   * successfully. Receives the file's raw text content -- parsing and persisting it is
   * still the app's job, same boundary as before.
   */
  onImportView?: (content: string) => void;
  /** e.g. "Acknowledgements" -- shown in the Import dialog as "The file has to be for
   * Acknowledgements". Omit for a generic subtitle when there's no specific entity name. */
  importEntityLabel?: string;
  /** Reverts the grid's unsaved changes back to the active view's saved state. */
  onDiscard?: () => void;
  /** The app's role check — Orderbahn gates this on a "grid preferences" permission. */
  disabled?: boolean;
}

/**
 * Saved-views control. Deliberately storage-agnostic: it renders a list the app owns and
 * reports intent. Persisting a view is `onGridStateChange` plus whatever API the app has.
 */
export function DataGridViewSelector<TData = any>({
  views,
  activeId,
  hasUnsavedChanges = false,
  onSelect,
  onSaveChanges,
  onSaveAs,
  onSetDefault,
  onUnpin,
  onRename,
  onDuplicate,
  onDelete,
  onExportView,
  onImportView,
  importEntityLabel,
  onDiscard,
  disabled = false,
}: DataGridViewSelectorProps<TData>) {
  const [saveAsOpen, setSaveAsOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  const active = views.find(view => view.id === activeId);
  const label = active ? active.name : 'Unsaved view';

  const isDuplicateName = (candidate: string) => {
    const normalized = candidate.trim().toLowerCase();
    return views.some(view => view.name.trim().toLowerCase() === normalized);
  };
  const saveAsDuplicate = name.trim().length > 0 && isDuplicateName(name);

  const handleSaveAs = () => {
    const trimmed = name.trim();
    if (!trimmed || isDuplicateName(trimmed)) return;
    onSaveAs?.(trimmed);
    setName('');
    setSaveAsOpen(false);
  };

  const handleRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed || !active) return;
    onRename?.(active.id, trimmed);
    setRenameOpen(false);
  };

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={dataGridToolbarPillClass}
            disabled={disabled}
            aria-label={`View: ${label}`}
          >
            {label}
            {hasUnsavedChanges && (
              <Badge variant="soft" color="orange" className="ml-1.5">
                Unsaved
              </Badge>
            )}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {views.map(view => (
            <DropdownMenuItem key={view.id} onClick={() => onSelect(view.id)}>
              {view.id === activeId && <Check className="h-3.5 w-3.5 text-brand-700" />}
              <span className={view.id !== activeId ? 'pl-[1.375rem]' : undefined}>{view.name}</span>
              {view.isDefault && (
                <Badge variant="soft" color="blue" className="ml-auto">
                  Default
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
          {onSaveAs && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSaveAsOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Save current view as new...
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Alternates with the Save button below depending on hasUnsavedChanges: a "+" to
       * start a new view when there's nothing to save, a Save icon to commit to the
       * active one when there is -- never both at once. */}
      {!hasUnsavedChanges && onSaveAs && (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          aria-label="New view"
          disabled={disabled}
          onClick={() => setSaveAsOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}

      {hasUnsavedChanges && onSaveChanges && active && (
        <Button
          size="icon"
          className="h-8 w-8 rounded-full"
          aria-label="Save changes"
          disabled={disabled}
          onClick={() => onSaveChanges(active.id)}
        >
          <Save className="h-4 w-4" />
        </Button>
      )}

      {hasUnsavedChanges && onDiscard && (
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          disabled={disabled}
          onClick={onDiscard}
        >
          <Undo2 className="mr-2 h-4 w-4" />
          Discard
        </Button>
      )}

      {(((onSaveChanges ||
        onSetDefault ||
        onUnpin ||
        onRename ||
        onDuplicate ||
        onDelete ||
        onExportView) &&
        active) ||
        onImportView) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8 rounded-full border', disabled && 'opacity-50')}
              aria-label="View actions"
              disabled={disabled}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {active && hasUnsavedChanges && onSaveChanges && (
              <DropdownMenuItem onClick={() => onSaveChanges(active.id)}>Save changes</DropdownMenuItem>
            )}
            {active && onSetDefault && !active.isDefault && (
              <DropdownMenuItem onClick={() => onSetDefault(active.id)}>Set as default</DropdownMenuItem>
            )}
            {active && onUnpin && active.isDefault && (
              <DropdownMenuItem onClick={() => onUnpin(active.id)}>Unpin</DropdownMenuItem>
            )}
            {active && onRename && (
              <DropdownMenuItem
                onClick={() => {
                  setRenameValue(active.name);
                  setRenameOpen(true);
                }}
              >
                Rename
              </DropdownMenuItem>
            )}
            {active && onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(active.id)}>Duplicate</DropdownMenuItem>
            )}
            {active && onDelete && (
              <DropdownMenuItem onClick={() => setDeleteConfirmOpen(true)}>Delete view</DropdownMenuItem>
            )}
            {active && onExportView && (
              <DropdownMenuItem
                onClick={() => {
                  const content = onExportView(active.id);
                  if (!content) return;
                  downloadBrowserFile(content, `${active.name}.stratagrid.json`, 'application/json');
                }}
              >
                Export view
              </DropdownMenuItem>
            )}
            {onImportView && (
              <DropdownMenuItem onClick={() => setImportOpen(true)}>Import view</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as new view</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="data-grid-view-name">View name</Label>
            <Input
              id="data-grid-view-name"
              aria-label="View name"
              aria-invalid={saveAsDuplicate}
              value={name}
              onChange={event => setName(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') handleSaveAs();
              }}
            />
            {saveAsDuplicate && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                You already have a view named &ldquo;{name.trim()}&rdquo;
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveAsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAs} disabled={!name.trim() || saveAsDuplicate}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameOpen}
        onOpenChange={open => {
          if (!open) setRenameValue('');
          setRenameOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename view</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="data-grid-view-rename">View name</Label>
            <Input
              id="data-grid-view-rename"
              aria-label="View name"
              value={renameValue}
              onChange={event => setRenameValue(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') handleRename();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {active && onDelete && (
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={() => onDelete(active.id)}
          title="Delete view"
          description={`Are you sure you want to delete "${active.name}"? This can't be undone.`}
          confirmLabel="Delete view"
        />
      )}

      {onImportView && (
        <ImportViewDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          entityLabel={importEntityLabel}
          onImportFile={content => {
            onImportView(content);
            setImportOpen(false);
          }}
        />
      )}
    </div>
  );
}
