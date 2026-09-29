
import * as React from 'react';
import { Button } from '@/components/application-ui/button';
import { Input } from '@/components/forms/input';
import { Label } from '@/components/application-ui/label';
import { Popover as InnerPopover, PopoverContent as InnerPopoverContent, PopoverTrigger as InnerPopoverTrigger } from '@/components/overlays/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/forms/select';
import { Checkbox } from '@/components/forms/checkbox';
import { Calendar } from '@/components/application-ui/calendar';
import type { ColumnDefinition, ColumnFilter, FilterValue, NumberFilterOperator, DateRangePreset, DateTreeFilterValue } from './types';
import { numberFilterOperators, dateRangePresetOptions, textFilterOperators, selectFilterOperators, booleanFilterOperators, dateTreeFilterOperators, dateFilterOperators } from './types';
import {
  asColumnFilter,
  pruneColumnFilter,
  withCondition,
  withConditionAt,
  withLink,
  withoutConditionAt,
} from './filters/filter-model';
import { defaultOperatorFor } from './filters/operators';
import { FilterX, CalendarIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/utils';

const OPERATOR_LABELS: Record<string, string> = {
  contains: 'Contains',
  equals: 'Equals',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  isEmpty: 'Is empty',
  isNotEmpty: 'Is not empty',
  isAnyOf: 'Is any of',
  isNoneOf: 'Is none of',
  isChecked: 'Is checked',
  isNotChecked: 'Is not checked',
  inBucket: 'In selected months',
  is: 'Is',
  before: 'Is before',
  after: 'Is after',
  onOrBefore: 'Is on or before',
  onOrAfter: 'Is on or after',
  between: 'Is between',
  '=': 'Equals',
  '!=': 'Does not equal',
  '<': 'Less than',
  '>': 'Greater than',
  '<=': 'Less than or equal',
  '>=': 'Greater than or equal',
};

interface FilterConditionEditorProps<TData> {
  column: ColumnDefinition<TData>;
  condition: FilterValue;
  onChange: (next: FilterValue) => void;
}

/** One condition's per-type input. The domain slot wins over everything built in,
 * exactly as `cellRenderer` does for cells. */
export function FilterConditionEditor<TData>({ column, condition, onChange }: FilterConditionEditorProps<TData>) {
  const [optionSearch, setOptionSearch] = React.useState('');
  const [expandedYears, setExpandedYears] = React.useState<Set<string>>(new Set());

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (column.filterRenderer) {
    return (
      <>{column.filterRenderer({ value: condition, operator: String(condition.operator ?? ''), onChange })}</>
    );
  }

  const filterValue = condition;
  const onFilterChange = (_field: string, value?: FilterValue) => onChange(value as FilterValue);

  switch (column.filterType) {
      case 'text': {
        const textFilter = filterValue as FilterValue & { type: 'text' } | undefined;
        const operator = textFilter?.operator ?? 'contains';
        const needsValue = operator !== 'isEmpty' && operator !== 'isNotEmpty';
        return (
          <div className="space-y-2">
            <Select
              value={operator}
              onValueChange={(op) =>
                onFilterChange(column.field, { type: 'text', operator: op as never, value: textFilter?.value ?? '' })
              }
            >
              <SelectTrigger className="w-full" aria-label={`${column.headerText} text filter operator`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {textFilterOperators.map((op) => (
                  <SelectItem key={op} value={op}>{OPERATOR_LABELS[op]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {needsValue && (
              <Input
                type="text"
                placeholder={`Filter ${column.headerText}...`}
                value={textFilter?.value || ''}
                onChange={(e) => onFilterChange(column.field, { type: 'text', operator, value: e.target.value })}
                className="w-full"
                aria-label={`${column.headerText} text filter input`}
              />
            )}
          </div>
        );
      }
      case 'number': {
        const numFilter = filterValue as FilterValue & { value?: number; value2?: number; operator: NumberFilterOperator } ||
                          { type: 'number', operator: '=', value: undefined, value2: undefined };
        return (
          <div className="space-y-2">
            <Select
              value={numFilter?.operator || '='}
              onValueChange={(op) =>
                onFilterChange(column.field, {
                  type: 'number',
                  operator: op as NumberFilterOperator,
                  value: numFilter?.value,
                  value2: numFilter?.value2,
                })
              }
            >
              <SelectTrigger className="w-full" aria-label={`${column.headerText} number filter operator`}>
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent>
                {numberFilterOperators.map((op) => (
                  <SelectItem key={op} value={op}>{OPERATOR_LABELS[op]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className={cn("flex gap-2", numFilter?.operator !== 'between' && "flex-col")}>
              <Input
                type="number"
                placeholder={numFilter?.operator === 'between' ? "Min value" : "Value"}
                value={numFilter?.value === undefined ? '' : numFilter.value}
                onChange={(e) =>
                  onFilterChange(column.field, {
                    type: 'number',
                    operator: numFilter?.operator || '=',
                    value: e.target.value === '' ? undefined : parseFloat(e.target.value),
                    value2: numFilter?.value2,
                  })
                }
                className="w-full"
                aria-label={`${column.headerText} number filter value input ${numFilter?.operator === 'between' ? 'minimum' : ''}`}
              />
              {numFilter?.operator === 'between' && (
                <Input
                  type="number"
                  placeholder="Max value"
                  value={numFilter?.value2 === undefined ? '' : numFilter.value2}
                  onChange={(e) =>
                    onFilterChange(column.field, {
                      type: 'number',
                      operator: numFilter.operator,
                      value: numFilter.value,
                      value2: e.target.value === '' ? undefined : parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                  aria-label={`${column.headerText} number filter value input maximum`}
                />
              )}
            </div>
          </div>
        );
      }
      case 'date': {
        const dateFilter = filterValue as FilterValue & { type: 'date' } ||
                           { type: 'date', preset: 'all', value: undefined, value2: undefined };

        const handlePresetChange = (preset: DateRangePreset) => {
           // A non-custom preset never honours `operator` (see operatorApplies) — don't
           // carry a meaningless one forward into the saved filter shape.
           onFilterChange(column.field, { type: 'date', preset, operator: preset === 'custom' ? dateFilter.operator : undefined, value: preset !== 'custom' ? undefined : dateFilter.value, value2: preset !== 'custom' ? undefined : dateFilter.value2 });
        }

        const dateOperator = dateFilter.operator ?? 'between';
        const dateNeedsValue = dateOperator !== 'isEmpty' && dateOperator !== 'isNotEmpty';
        const dateNeedsSecondValue = dateNeedsValue && dateOperator === 'between';

        const handleDateOperatorChange = (operator: string) => {
          onFilterChange(column.field, { type: 'date', preset: 'custom', operator: operator as never, value: dateFilter.value, value2: dateFilter.value2 });
        }

        const handleStartDateChange = (date?: Date) => {
            onFilterChange(column.field, { type: 'date', preset: 'custom', operator: dateFilter.operator, value: date, value2: dateFilter.value2 });
        }
        const handleEndDateChange = (date?: Date) => {
            onFilterChange(column.field, { type: 'date', preset: 'custom', operator: dateFilter.operator, value: dateFilter.value, value2: date });
        }

        return (
          <div className="space-y-2">
            <Select
              value={dateFilter.preset || 'all'}
              onValueChange={(val) => handlePresetChange(val as DateRangePreset)}
            >
              <SelectTrigger className="w-full" aria-label={`${column.headerText} date range preset`}>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                {dateRangePresetOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {dateFilter.preset === 'custom' && (
              <div className="space-y-2">
                <Select value={dateOperator} onValueChange={handleDateOperatorChange}>
                  <SelectTrigger className="w-full" aria-label={`${column.headerText} date filter operator`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFilterOperators.map((op) => (
                      <SelectItem key={op} value={op}>{OPERATOR_LABELS[op]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dateNeedsValue && (
                 <InnerPopover>
                    <InnerPopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${!dateFilter.value && "text-muted-foreground"}`}
                        aria-label={`${column.headerText} custom start date, current value: ${dateFilter.value ? format(dateFilter.value, "PPP") : 'Pick start date'}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter.value ? format(dateFilter.value, "PPP") : <span>Start date</span>}
                      </Button>
                    </InnerPopoverTrigger>
                    <InnerPopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFilter.value}
                        onSelect={handleStartDateChange}
                        autoFocus
                      />
                    </InnerPopoverContent>
                  </InnerPopover>
                )}

                {dateNeedsSecondValue && (
                  <InnerPopover>
                    <InnerPopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${!dateFilter.value2 && "text-muted-foreground"}`}
                        aria-label={`${column.headerText} custom end date, current value: ${dateFilter.value2 ? format(dateFilter.value2, "PPP") : 'Pick end date'}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter.value2 ? format(dateFilter.value2, "PPP") : <span>End date</span>}
                      </Button>
                    </InnerPopoverTrigger>
                    <InnerPopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFilter.value2}
                        onSelect={handleEndDateChange}
                        disabled={(date) => dateFilter.value ? date < dateFilter.value : false}
                        autoFocus
                      />
                    </InnerPopoverContent>
                  </InnerPopover>
                )}
              </div>
            )}
          </div>
        );
      }
      case 'date-tree': {
        const buckets = column.dateTreeBuckets || [];
        const treeFilter = filterValue as DateTreeFilterValue | undefined;
        const selected = new Set(treeFilter?.selected || []);
        const treeOperator = treeFilter?.operator ?? 'inBucket';
        const needsBuckets = treeOperator !== 'isEmpty' && treeOperator !== 'isNotEmpty';

        const yearKeys = (year: string, months: string[]) => months.map(m => `${year}-${m}`);
        const yearState = (year: string, months: string[]): 'all' | 'none' | 'some' => {
          const keys = yearKeys(year, months);
          const checkedCount = keys.filter(k => selected.has(k)).length;
          if (checkedCount === 0) return 'none';
          return checkedCount === keys.length ? 'all' : 'some';
        };
        const commit = (next: Set<string>) => {
          // Always emits a value, even when empty — one condition can't collapse to
          // "no filter" mid-list; the popover's Clear/Remove buttons own that decision.
          onFilterChange(column.field, { type: 'date-tree', operator: treeOperator, selected: Array.from(next) });
        };
        const emitTreeOperator = (nextOperator: typeof treeOperator) =>
          onFilterChange(column.field, { type: 'date-tree', operator: nextOperator, selected: treeFilter?.selected ?? [] });
        const toggleYear = (year: string, months: string[]) => {
          const keys = yearKeys(year, months);
          const next = new Set(selected);
          if (yearState(year, months) === 'all') {
            keys.forEach(k => next.delete(k));
          } else {
            keys.forEach(k => next.add(k));
          }
          commit(next);
        };
        const toggleMonth = (year: string, month: string) => {
          const key = `${year}-${month}`;
          const next = new Set(selected);
          if (next.has(key)) next.delete(key); else next.add(key);
          commit(next);
        };
        const toggleExpand = (year: string) => {
          setExpandedYears(prev => {
            const next = new Set(prev);
            if (next.has(year)) next.delete(year); else next.add(year);
            return next;
          });
        };

        return (
          <div className="space-y-2">
            <Select value={treeOperator} onValueChange={(op) => emitTreeOperator(op as never)}>
              <SelectTrigger className="w-full" aria-label={`${column.headerText} date-tree filter operator`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateTreeFilterOperators.map((op) => (
                  <SelectItem key={op} value={op}>{OPERATOR_LABELS[op]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {needsBuckets && (
          <div className="max-h-64 space-y-0.5 overflow-y-auto scrollbar-minimal pr-1">
            {buckets.length ? buckets.map(({ year, months }) => {
              const state = yearState(year, months);
              const isExpanded = expandedYears.has(year);
              return (
                <div key={year}>
                  <div className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted">
                    <button
                      type="button"
                      onClick={() => toggleExpand(year)}
                      className="rounded p-0.5 hover:bg-accent"
                      aria-label={isExpanded ? `Collapse ${year}` : `Expand ${year}`}
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                    <label className="flex flex-1 items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={state === 'all' ? true : state === 'some' ? 'indeterminate' : false}
                        onCheckedChange={() => toggleYear(year, months)}
                        aria-label={`Filter ${column.headerText} by ${year}`}
                      />
                      {year}
                    </label>
                  </div>
                  {isExpanded && (
                    <div className="ml-7 space-y-0.5">
                      {months.map(month => (
                        <label
                          key={month}
                          className="flex items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={selected.has(`${year}-${month}`)}
                            onCheckedChange={() => toggleMonth(year, month)}
                            aria-label={`Filter ${column.headerText} by ${MONTH_LABELS[Number(month) - 1]} ${year}`}
                          />
                          {MONTH_LABELS[Number(month) - 1]}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="text-sm text-muted-foreground px-1 py-1">No dates available</div>
            )}
          </div>
            )}
          </div>
        );
      }
      case 'select': {
        // Multi-select: searchable checkbox list. Selected values are kept as string[].
        const selectFilter = filterValue as FilterValue & { type: 'select' } | undefined;
        const selected = Array.isArray(selectFilter?.value)
          ? selectFilter.value
          : selectFilter?.value ? [String(selectFilter.value)] : [];
        const options = column.filterOptions || [];
        const query = optionSearch.trim().toLowerCase();
        const visibleOptions = query
          ? options.filter(o => String(o.label).toLowerCase().includes(query))
          : options;
        const selectOperator = selectFilter?.operator ?? 'isAnyOf';
        const needsSelectValue = selectOperator !== 'isEmpty' && selectOperator !== 'isNotEmpty';
        // Always emits a value — see the date-tree `commit` comment above.
        const emitSelect = (nextOperator: typeof selectOperator, nextSelected: string[]) =>
          onFilterChange(column.field, { type: 'select', operator: nextOperator, value: nextSelected });
        const toggleValue = (value: string, checked: boolean) => {
          const next = checked
            ? [...selected.filter(v => v !== value), value]
            : selected.filter(v => v !== value);
          emitSelect(selectOperator, next);
        };
        return (
          <div className="space-y-2">
            <Select value={selectOperator} onValueChange={(op) => emitSelect(op as never, selected)}>
              <SelectTrigger className="w-full" aria-label={`${column.headerText} select filter operator`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectFilterOperators.map((op) => (
                  <SelectItem key={op} value={op}>{OPERATOR_LABELS[op]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {needsSelectValue && (
              <>
                <Input
                  type="search"
                  placeholder={`Find ${column.headerText.toLowerCase()}...`}
                  value={optionSearch}
                  onChange={(e) => setOptionSearch(e.target.value)}
                  className="w-full h-8"
                  aria-label={`${column.headerText} option search`}
                />
                <div className="max-h-56 overflow-y-auto scrollbar-minimal space-y-1 pr-1">
                  {visibleOptions.length ? visibleOptions.map((option) => {
                    const value = String(option.value);
                    return (
                      <label
                        key={value}
                        className="flex items-start gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={selected.includes(value)}
                          onCheckedChange={(checked) => toggleValue(value, !!checked)}
                          aria-label={`Filter ${column.headerText} by ${option.label}`}
                        />
                        <span className="break-words min-w-0">{option.label}</span>
                      </label>
                    );
                  }) : (
                    <div className="text-sm text-muted-foreground px-1 py-1">No matching options</div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      }
      case 'boolean': {
        const boolFilter = filterValue as FilterValue & { type: 'boolean' } | undefined;
        const operator = boolFilter?.operator ?? (boolFilter?.value === false ? 'isNotChecked' : 'isChecked');
        return (
          <Select
            value={boolFilter ? operator : ''}
            onValueChange={(op) =>
              onFilterChange(column.field, { type: 'boolean', operator: op as never, value: op === 'isChecked' })
            }
          >
            <SelectTrigger className="w-full" aria-label={`${column.headerText} boolean filter`}>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              {booleanFilterOperators.map((op) => (
                <SelectItem key={op} value={op}>{OPERATOR_LABELS[op]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      default:
        return null;
    }
}

interface DataGridFilterPopoverProps<TData> {
  column: ColumnDefinition<TData>;
  /** The committed filter for this column. */
  filterValue?: ColumnFilter | FilterValue;
  /** Commits a filter. Called once per keystroke in 'immediate' mode, once per Apply in 'manual'. */
  onFilterChange: (field: string, value?: ColumnFilter) => void;
  applyMode: 'immediate' | 'manual';
  onClose?: () => void;
}

export function DataGridFilterPopover<TData>({
  column,
  filterValue,
  onFilterChange,
  applyMode,
  onClose,
}: DataGridFilterPopoverProps<TData>) {
  const committed = asColumnFilter(filterValue);
  const blank = React.useCallback(
    (): FilterValue =>
      ({
        type: column.filterType ?? 'text',
        operator: defaultOperatorFor(column.filterType ?? 'text'),
        ...(column.filterType === 'date-tree' ? { selected: [] } : { value: '' }),
      } as unknown as FilterValue),
    [column.filterType],
  );

  // The draft is the single source of truth while the popover is open. In 'immediate'
  // mode every draft change is also committed straight away, so the two never diverge.
  const [draft, setDraft] = React.useState<ColumnFilter>(
    () => committed ?? { conditions: [blank()], link: 'AND' },
  );
  const [dirty, setDirty] = React.useState(false);

  // Never auto-close on a value change, in any filter type, in 'immediate' mode -- doing
  // so for "pick one" types (select/boolean/date/date-tree) made multi-value selects and
  // the multi-condition builder unusable: every checkbox click, year/month toggle, or
  // AND/OR flip dismissed the popover before the user could make a second choice.
  // Explicit dismissal (outside click, Escape, or Cancel/Apply in 'manual' mode) is the
  // only thing that closes it now.
  const update = (next: ColumnFilter | undefined) => {
    const value = next ?? { conditions: [blank()], link: draft.link };
    setDraft(value);
    if (applyMode === 'immediate') {
      onFilterChange(column.field, pruneColumnFilter(value, column.filterType));
    } else {
      setDirty(true);
    }
  };

  const handleApply = () => {
    onFilterChange(column.field, pruneColumnFilter(draft, column.filterType));
    setDirty(false);
    onClose?.();
  };

  const handleCancel = () => {
    setDraft(committed ?? { conditions: [blank()], link: 'AND' });
    setDirty(false);
    onClose?.();
  };

  const handleClearFilter = () => {
    setDraft({ conditions: [blank()], link: 'AND' });
    setDirty(false);
    onFilterChange(column.field, undefined);
  };

  if (!column.filterable || !column.filterType) {
    return null;
  }

  return (
    <div className="space-y-3 p-1" data-testid={`filter-popover-${column.field}`}>
      <Label className="font-semibold">{column.headerText} Filter</Label>
      {draft.conditions.map((condition, index) => (
        <div key={index} className="space-y-2">
          {index > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              aria-label={draft.link === 'AND' ? 'Match any condition' : 'Match all conditions'}
              onClick={() => update(withLink(draft, draft.link === 'AND' ? 'OR' : 'AND'))}
            >
              {draft.link === 'AND' ? 'AND' : 'OR'}
            </Button>
          )}
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <FilterConditionEditor
                column={column}
                condition={condition}
                onChange={next => update(withConditionAt(draft, index, next))}
              />
            </div>
            {draft.conditions.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label={`Remove condition ${index + 1}`}
                onClick={() => update(withoutConditionAt(draft, index))}
              >
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={() => update(withCondition(draft, blank()))}>
          Add condition
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClearFilter}>
          Clear filter
        </Button>
      </div>

      {applyMode === 'manual' && (
        <div className="flex items-center justify-end gap-2 border-t pt-2">
          {dirty && <span className="mr-auto text-xs text-muted-foreground">Not applied yet</span>}
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} disabled={!dirty}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
