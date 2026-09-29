import * as React from 'react';
import { Button } from '@/components/application-ui/button';
import { Input } from '@/components/forms/input';
import { ArrowUpDown, ChevronDown, FileDown, Filter, Rows3, Search, X } from 'lucide-react';
import { cn } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/overlays/dropdown-menu';
import { ColumnVisibilityToggle } from '../ColumnVisibilityToggle';
import { DENSITIES, type GridDensity } from '../state/density';
import type { ColumnDefinition, DataGridToolbarContext, FilterLink, SortConfig } from '../types';

/**
 * Every toolbar action button renders as this light-gray, fully-rounded "pill" --
 * exported so app-supplied `toolbarActions` (e.g. a custom "Refresh Grid" button)
 * can match Columns/Filters/Density/Export/Sort instead of re-deriving their own look.
 */
export const dataGridToolbarPillClass = 'rounded-full bg-background hover:bg-border/60';

export interface DataGridToolbarProps<TData> {
  globalFilter: string;
  globalFilterPlaceholder?: string;
  onGlobalFilterChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  activeFilterCount: number;
  activeColumnFilterCount: number;
  /** One entry per active column filter, for the Filters dropdown's per-filter remove. */
  activeColumnFilterEntries: { field: string; label: string; onRemove: () => void }[];
  onClearAllFilters: () => void;
  enableFind: boolean;
  onOpenFind: () => void;
  allColumns: ColumnDefinition<TData>[];
  visibleColumns: string[];
  onColumnVisibilityChange: (field: string, isVisible: boolean) => void;
  onExportCsv: () => void;
  onExportXlsx: () => void;
  toolbarActions?: React.ReactNode | ((ctx: DataGridToolbarContext) => React.ReactNode);
  toolbarViewSelector?: React.ReactNode;
  toolbarContext: DataGridToolbarContext;
  showEditSession: boolean;
  sessionError?: string | null;
  density: GridDensity;
  onDensityChange: (density: GridDensity) => void;
  showDensityControl: boolean;
  showColumnsControl?: boolean;
  showFiltersControl?: boolean;
  showExportControl?: boolean;
  filterLogicOperator: FilterLink;
  onFilterLogicOperatorChange: (link: FilterLink) => void;
  sortConfig: SortConfig<TData> | null;
  onClearSort: () => void;
}

/**
 * The grid's top bar. Extracted from DataGrid.tsx verbatim so it could grow a
 * consumer slot without growing that file.
 */
export function DataGridToolbar<TData>({
  globalFilter,
  globalFilterPlaceholder,
  onGlobalFilterChange,
  activeFilterCount,
  activeColumnFilterCount,
  activeColumnFilterEntries,
  onClearAllFilters,
  enableFind,
  onOpenFind,
  allColumns,
  visibleColumns,
  onColumnVisibilityChange,
  onExportCsv,
  onExportXlsx,
  toolbarActions,
  toolbarViewSelector,
  toolbarContext,
  showEditSession,
  sessionError,
  density,
  onDensityChange,
  showDensityControl,
  showColumnsControl = true,
  showFiltersControl = true,
  showExportControl = true,
  filterLogicOperator,
  onFilterLogicOperatorChange,
  sortConfig,
  onClearSort,
}: DataGridToolbarProps<TData>) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-4" data-toolbar-row="main">
      {toolbarViewSelector}
      <div className="relative w-72 max-w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={globalFilterPlaceholder}
          value={globalFilter}
          onChange={onGlobalFilterChange}
          className="h-9 w-full rounded-full border-border bg-background pl-9 pr-8"
          aria-label="Global search input"
        />
        {globalFilter && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onGlobalFilterChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {showEditSession && !toolbarContext.editSession.isEditing && (
        <Button variant="outline" size="sm" className={dataGridToolbarPillClass} onClick={toolbarContext.editSession.begin}>
          Edit
        </Button>
      )}
      {showEditSession && toolbarContext.editSession.isEditing && (
        <>
          {sessionError && <span className="text-xs text-destructive">{sessionError}</span>}
          <Button
            size="sm"
            className="rounded-full"
            disabled={toolbarContext.editSession.dirtyCount === 0 || toolbarContext.editSession.isSaving}
            onClick={toolbarContext.editSession.saveAll}
          >
            Save {toolbarContext.editSession.dirtyCount}{' '}
            {toolbarContext.editSession.dirtyCount === 1 ? 'change' : 'changes'}
          </Button>
          <Button variant="ghost" size="sm" className={dataGridToolbarPillClass} onClick={toolbarContext.editSession.discard}>
            Discard
          </Button>
        </>
      )}
      {showColumnsControl && (
        <ColumnVisibilityToggle
          allColumns={allColumns}
          visibleColumns={visibleColumns}
          onVisibilityChange={onColumnVisibilityChange}
          triggerClassName={dataGridToolbarPillClass}
        />
      )}
      {showFiltersControl && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={dataGridToolbarPillClass}
              aria-label={activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {activeColumnFilterCount > 1 && (
              <>
                <DropdownMenuItem
                  onClick={() => onFilterLogicOperatorChange(filterLogicOperator === 'AND' ? 'OR' : 'AND')}
                >
                  {filterLogicOperator === 'AND' ? 'Match all' : 'Match any'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {activeColumnFilterEntries.map(entry => (
              <DropdownMenuItem
                key={entry.field}
                onSelect={event => event.preventDefault()}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate">{entry.label}</span>
                <button
                  type="button"
                  aria-label={`Remove filter: ${entry.label}`}
                  className="shrink-0 rounded-sm p-0.5 hover:bg-accent"
                  onClick={entry.onRemove}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuItem>
            ))}
            {activeColumnFilterEntries.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No active filters.</div>
            )}
            {activeColumnFilterEntries.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={onClearAllFilters} disabled={activeFilterCount === 0}>
              Clear all
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {showDensityControl && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={dataGridToolbarPillClass} aria-label="Density">
              <Rows3 className="mr-2 h-4 w-4" />
              Density
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {DENSITIES.map(option => (
              <DropdownMenuCheckboxItem
                key={option}
                checked={option === density}
                onClick={() => onDensityChange(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {showExportControl && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={dataGridToolbarPillClass}>
              <FileDown className="mr-2 h-4 w-4" />
              Export
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportCsv}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportXlsx}>
              Export as XLSX
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {typeof toolbarActions === 'function' ? toolbarActions(toolbarContext) : toolbarActions}
      {sortConfig && (
        <div className={cn('flex items-center gap-1 px-2 py-1.5 text-sm', dataGridToolbarPillClass)}>
          <ArrowUpDown className="h-4 w-4" />
          <span>Sort</span>
          <button
            type="button"
            aria-label="Clear sort"
            className="rounded-full p-0.5 hover:bg-background"
            onClick={onClearSort}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
