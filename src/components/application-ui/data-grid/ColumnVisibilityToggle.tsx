import * as React from 'react';
import type { ColumnDefinition } from './types';
import { Button } from '@/components/application-ui/button';
import { Input } from '@/components/forms/input';
import { Switch } from '@/components/forms/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/overlays/popover';
import { ChevronDown, ListFilter, Search } from 'lucide-react';

interface ColumnVisibilityToggleProps<TData> {
  allColumns: ColumnDefinition<TData>[];
  visibleColumns: string[];
  onVisibilityChange: (field: string, isVisible: boolean) => void;
  triggerClassName?: string;
}

export function ColumnVisibilityToggle<TData>({
  allColumns,
  visibleColumns,
  onVisibilityChange,
  triggerClassName,
}: ColumnVisibilityToggleProps<TData>) {
  const [query, setQuery] = React.useState('');
  const hideableColumns = React.useMemo(() => allColumns.filter(col => col.hideable !== false), [allColumns]);
  const filteredColumns = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return hideableColumns;
    return hideableColumns.filter(col => col.headerText.toLowerCase().includes(normalized));
  }, [hideableColumns, query]);
  const hasGroups = filteredColumns.some(col => col.group);

  // Preserve definition order while clustering each group's columns under one label.
  const sections = React.useMemo(() => {
    if (!hasGroups) return [{ group: undefined as string | undefined, columns: filteredColumns }];
    const byGroup = new Map<string | undefined, ColumnDefinition<TData>[]>();
    filteredColumns.forEach(col => {
      const key = col.group;
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key)!.push(col);
    });
    return Array.from(byGroup.entries()).map(([group, columns]) => ({ group, columns }));
  }, [filteredColumns, hasGroups]);

  const showAll = () => {
    filteredColumns.forEach(col => {
      if (!visibleColumns.includes(col.field)) {
        onVisibilityChange(col.field, true);
      }
    });
  };

  return (
    <Popover
      onOpenChange={open => {
        // Otherwise a search left over from the last time this panel was open pre-filters
        // the list again before the user has typed anything this time around.
        if (!open) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={triggerClassName}>
          <ListFilter className="mr-2 h-4 w-4" />
          Columns
          <ChevronDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="border-b p-2">
          <Input
            placeholder="Find column"
            aria-label="Find column"
            value={query}
            onChange={event => setQuery(event.target.value)}
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
            className="h-8"
          />
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-minimal p-1">
          {sections.map(({ group, columns }, sectionIndex) => (
            <React.Fragment key={group ?? `__ungrouped_${sectionIndex}`}>
              {group && (
                <div className="px-2 pt-2 pb-1 text-xs font-semibold text-muted-foreground">{group}</div>
              )}
              {columns.map(column => (
                <div key={column.field} className="flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-sm">
                  <span className={group ? 'pl-2' : undefined}>{column.headerText}</span>
                  <Switch
                    size="sm"
                    aria-label={column.headerText}
                    checked={visibleColumns.includes(column.field)}
                    onCheckedChange={checked => onVisibilityChange(column.field, checked)}
                  />
                </div>
              ))}
            </React.Fragment>
          ))}
          {filteredColumns.length === 0 && (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">No matching columns.</div>
          )}
        </div>
        <div className="flex items-center justify-end border-t p-2">
          <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground" onClick={showAll}>
            Show all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
