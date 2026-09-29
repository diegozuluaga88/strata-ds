import type { ColumnDefinition } from './types';
import { Button } from '@/components/application-ui/button';
import { X } from 'lucide-react';

interface DataGridGroupingPanelProps<TData> {
  groupedColumns: ColumnDefinition<TData>[]; // Columns currently in the grouping panel
  onUngroupColumn: (field: string) => void;
}

export function DataGridGroupingPanel<TData>({
  groupedColumns,
  onUngroupColumn,
}: DataGridGroupingPanelProps<TData>) {
  return (
    <div className="grouping-panel" aria-label="Column grouping panel">
      {groupedColumns.map((colDef) => (
        <div key={colDef.field} className="grouping-panel-pill" aria-label={`Grouped by ${colDef.headerText}`}>
          <span>{colDef.headerText}</span>
          <Button
            variant="ghost"
            size="icon"
            className="grouping-panel-pill-remove h-5 w-5"
            onClick={() => onUngroupColumn(colDef.field)}
            aria-label={`Remove ${colDef.headerText} from grouping`}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
