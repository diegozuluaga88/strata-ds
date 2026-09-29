
import * as React from 'react';
import type { ColumnDefinition, SortConfig, ColumnFilter, ActiveFilters } from './types';
import { isColumnFilterActive } from './filters/filter-model';
import { DEFAULT_COL_WIDTH, MIN_RESIZE_COL_WIDTH } from './constants';
import { Button } from '@/components/application-ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/overlays/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/overlays/dropdown-menu';
import { DataGridFilterPopover } from './DataGridFilterPopover';
import { ChevronsUpDown, ChevronUp, ChevronDown, MoreHorizontal, PinOff, Users, Mail, CalendarDays, Hash, Edit3, Activity } from 'lucide-react';
import { cn } from '@/utils';

interface DataGridHeaderCellProps<TData> {
  column: ColumnDefinition<TData>;
  sortConfig: SortConfig<TData> | null;
  onSort: (field: string) => void;
  onFilterChange: (field: string, value?: ColumnFilter) => void;
  columnFilters: ActiveFilters<TData>;
  currentWidth: string | number;
  onColumnWidthChange: (field: string, newWidth: number) => void;
  onPinColumn: (field: string, position: 'left' | 'right' | null) => void;
  /** Grouping menu items only render when both are supplied. */
  onGroupColumn?: (field: string) => void;
  onUngroupColumn?: (field: string) => void;
  enableGroupingPanel?: boolean;
  isGrouped?: boolean;
  isDraggableForReorder?: boolean; // For column reordering
  currentPinnedState?: 'left' | 'right' | null;
  onDragStartColumn: (field: string, event: React.DragEvent) => void; // Generic drag start
  filterApplyMode: 'immediate' | 'manual';
}

const iconMap: { [key: string]: React.ElementType } = {
  Users,
  Mail,
  CalendarDays,
  Hash,
  Edit3,
  Activity,
};

/** Rendered-px floor for a column: its own minWidth when set, else MIN_RESIZE_COL_WIDTH. */
function resizeFloor(col: { minWidth?: number | string }): number {
  const min = parseFloat(String(col.minWidth ?? MIN_RESIZE_COL_WIDTH));
  return Number.isFinite(min) ? min : MIN_RESIZE_COL_WIDTH;
}

function toPx(value: unknown, fallback: number): number {
  const px = parseFloat(String(value));
  return Number.isFinite(px) && px > 0 ? px : fallback;
}

export function DataGridHeaderCell<TData>({
  column,
  sortConfig,
  onSort,
  onFilterChange,
  columnFilters,
  currentWidth,
  onColumnWidthChange,
  onPinColumn,
  onGroupColumn,
  onUngroupColumn,
  enableGroupingPanel,
  isGrouped,
  isDraggableForReorder,
  currentPinnedState,
  onDragStartColumn,
  filterApplyMode,
}: DataGridHeaderCellProps<TData>) {
  const isSorted = sortConfig?.field === column.field;
  const isFiltered = isColumnFilterActive(columnFilters[column.field]);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = React.useState(false);
  const IconComponent = column.iconName ? iconMap[column.iconName] : null;

  // No `truncate` here: both render branches below already wrap this in a wrapping
  // element, and a second one nested inside is dead markup. Putting it on the wrapper
  // rather than here also means a custom `headerRenderer` is wrapped on the same terms.
  const headerContent = column.headerRenderer ? column.headerRenderer() : column.headerText;

  const handleMouseDownOnResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = toPx(currentWidth, DEFAULT_COL_WIDTH);
    const floor = resizeFloor(column);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      onColumnWidthChange(column.field, Math.max(floor, startWidth + (moveEvent.clientX - startX)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClickOnResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const thElement = (event.target as HTMLElement).closest('th');
    if (!thElement) return;

    const tableElement = thElement.closest('table');
    if (!tableElement) return;

    const cells = Array.from(tableElement.querySelectorAll(`td[data-field="${column.field}"]`));

    let maxWidth = thElement.scrollWidth;

    cells.forEach((cell) => {
      const htmlCell = cell as HTMLElement;
      maxWidth = Math.max(maxWidth, htmlCell.scrollWidth);
    });

    const padding = 8;
    const finalWidth = maxWidth + padding;

    const minW = parseFloat(String(column.minWidth || MIN_RESIZE_COL_WIDTH));
    onColumnWidthChange(column.field, Math.max(minW, finalWidth));
  };

  const isResizable = column.resizable !== false;
  const isDraggable = isDraggableForReorder;
  const canPin = column.pinnable !== false;
  const canGroup = !!enableGroupingPanel && column.groupable !== false && !!onGroupColumn && !!onUngroupColumn;
  const canFilter = !!column.filterable && !!column.filterType;
  const hasColumnOptions = canPin || canGroup || canFilter;
  const isColumnOptionsActive = !!currentPinnedState || isFiltered || !!isGrouped;

  return (
    <div
      className={cn(
        "flex items-center justify-between group px-3 py-2 h-full w-full", // Changed padding here
        isDraggable && "cursor-grab"
      )}
      style={{ position: 'relative' }}
      draggable={isDraggable}
      onDragStart={(e) => isDraggable && onDragStartColumn(column.field, e)}
    >
      <div className="flex items-center flex-grow min-w-0">
        {IconComponent && <IconComponent className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />}
        {column.sortable ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSort(column.field);
            }}
            /* min-w-0 lets the button shrink below its content inside the flex parent,
             * and the label span then wraps within the cell instead of overflowing it.
             * Under table-layout:fixed the column width is authoritative, so without
             * these the text would overflow the cell. The sort icon keeps its own shrink-0. */
            className="h-auto px-1 py-0.5 -ml-1 text-left text-xs font-semibold flex-grow shrink min-w-0 justify-start hover:bg-accent"
            aria-label={`Sort by ${column.headerText}`}
          >
            {/* whitespace-normal overrides the Button's own base `whitespace-nowrap`,
             * which is inherited by this span and otherwise defeats line-clamp-2 --
             * without it the label never wraps, just overflows and gets clipped by
             * the header cell's own `overflow-hidden`. No break-words: wrapping should
             * only happen at word boundaries -- at text-xs "Acknowledgement" fits a
             * default 176px column on its own line, so breaking mid-word was never the
             * only option, just what `break-words` reached for regardless. */}
            <span className="line-clamp-2 whitespace-normal">{headerContent}</span>
            {isSorted && sortConfig?.direction === 'asc' && <ChevronUp className="ml-2 h-4 w-4 shrink-0 text-brand-700" />}
            {isSorted && sortConfig?.direction === 'desc' && <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-brand-700" />}
            {/* Sortable-but-not-currently-sorted columns get a dim, always-visible affordance
             * so users can tell a column is sortable without hovering -- matches the target
             * reference design's header treatment. */}
            {!isSorted && <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
          </Button>
        ) : (
          <div className="px-1 py-0.5 text-xs font-semibold flex-grow min-w-0">
            <span className="line-clamp-2">{headerContent}</span>
          </div>
        )}
      </div>

      {hasColumnOptions && (
        <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
          <DropdownMenu>
            <PopoverAnchor asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 shrink-0 invisible group-hover:visible group-focus-within:visible focus-visible:visible",
                    isColumnOptionsActive && "visible text-brand-700",
                    isFilterPopoverOpen && "visible bg-accent text-accent-foreground"
                  )}
                  aria-label={`Column options: ${column.headerText}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </PopoverAnchor>
            <DropdownMenuContent
              align="end"
              side="bottom"
              onClick={(e) => e.stopPropagation()}
              // Without this, closing this dropdown returns focus to the trigger button,
              // which Radix's Popover reads as an outside interaction and immediately
              // dismisses the Filter popover this same click just opened.
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {canPin && !currentPinnedState && (
                <>
                  <DropdownMenuItem onClick={() => onPinColumn(column.field, 'left')}>Pin left</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPinColumn(column.field, 'right')}>Pin right</DropdownMenuItem>
                </>
              )}
              {canPin && currentPinnedState && (
                <DropdownMenuItem onClick={() => onPinColumn(column.field, null)}>
                  <PinOff className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Unpin
                </DropdownMenuItem>
              )}
              {canGroup && canPin && <DropdownMenuSeparator />}
              {canGroup && !isGrouped && (
                <DropdownMenuItem onClick={() => onGroupColumn!(column.field)}>Group by this column</DropdownMenuItem>
              )}
              {canGroup && isGrouped && (
                <DropdownMenuItem onClick={() => onUngroupColumn!(column.field)}>Remove grouping</DropdownMenuItem>
              )}
              {canFilter && (canPin || canGroup) && <DropdownMenuSeparator />}
              {canFilter && (
                <DropdownMenuItem onClick={() => setIsFilterPopoverOpen(true)}>Filter...</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {canFilter && (
            <PopoverContent className="w-64 p-4" side="bottom" align="end" onClick={(e) => e.stopPropagation()}>
              <DataGridFilterPopover
                column={column}
                filterValue={columnFilters[column.field]}
                onFilterChange={onFilterChange}
                applyMode={filterApplyMode}
                onClose={() => setIsFilterPopoverOpen(false)}
              />
            </PopoverContent>
          )}
        </Popover>
      )}
      {isResizable && (
        <div
          className="resize-handle resize-handle-visible"
          onMouseDown={handleMouseDownOnResize}
          onDoubleClick={handleDoubleClickOnResize}
          onClick={(e) => e.stopPropagation()}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
