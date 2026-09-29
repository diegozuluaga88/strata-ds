'use client';

import * as React from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '../overlays/popover';
import { Input } from './input';
import { cn } from '@/utils';

export interface SearchableMultiSelectOption {
  id: string;
  label: string;
}

/** Props passed to `optComponent` for each dropdown row (rendered inside the row `button`). */
export interface SearchableMultiSelectOptComponentProps {
  option: SearchableMultiSelectOption;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getExtraPropsForOption(
  option: SearchableMultiSelectOption,
  options: SearchableMultiSelectOption[],
  optComponentProps: unknown[] | undefined,
): Record<string, unknown> {
  if (!optComponentProps?.length) return {};
  const index = options.findIndex((o) => o.id === option.id);
  if (index < 0) return {};
  const raw = optComponentProps[index];
  return isPlainObject(raw) ? raw : {};
}

export interface SearchableMultiSelectProps {
  options: SearchableMultiSelectOption[];
  value: SearchableMultiSelectOption[];
  onChange: (value: SearchableMultiSelectOption[]) => void;
  placeholder?: string;
  /** Optional icon shown before each selected tag label. */
  icon?: React.ReactNode;
  /**
   * Optional component for the inner content of each option row. It is rendered inside
   * the same `button` wrapper as the default (plus + label) row.
   */
  optComponent?: React.ComponentType<SearchableMultiSelectOptComponentProps>;
  /**
   * Extra props per option, aligned by index with the `options` array (same order).
   * Object entries are spread onto `optComponent` together with `option`.
   */
  optComponentProps?: unknown[];
  className?: string;
}

export function SearchableMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  icon,
  optComponent: OptComponent,
  optComponentProps,
  className,
}: SearchableMultiSelectProps): React.ReactElement {
  const DEBOUNCE_MS = 300;
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const focusOpenRef = React.useRef<number | null>(null);
  const hasUserTypedRef = React.useRef(false);
  const selectedIds = React.useMemo(() => new Set(value.map((v) => v.id)), [value]);

  React.useEffect(
    () => () => {
      if (focusOpenRef.current) window.clearTimeout(focusOpenRef.current);
    },
    [],
  );

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Show list only when user has typed and then stopped (not on initial mount)
      if (hasUserTypedRef.current) setOpen(true);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  // Case-insensitive filter; uses debounced value so filter runs after user stops typing.
  const filteredOptions = React.useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    return options.filter(
      (o) => !selectedIds.has(o.id) && (q === '' || o.label.toLowerCase().includes(q)),
    );
  }, [options, debouncedSearchQuery, selectedIds]);

  const hasNoMatch =
    debouncedSearchQuery.trim() !== '' &&
    filteredOptions.length === 0 &&
    !value.some((v) => v.label.toLowerCase() === debouncedSearchQuery.trim().toLowerCase());

  function handleSelect(option: SearchableMultiSelectOption): void {
    hasUserTypedRef.current = false;
    onChange([...value, option]);
    setSearchQuery('');
    setOpen(false);
  }

  function handleAddCustom(): void {
    const label = searchQuery.trim();
    if (!label) return;
    handleSelect({ id: `custom-${label}`, label });
    setOpen(false);
  }

  function handleRemove(item: SearchableMultiSelectOption): void {
    onChange(value.filter((x) => x.id !== item.id));
  }

  const optionRowButtonClassName =
    'flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-sm text-left cursor-pointer';

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="w-full">
            <Input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => {
                hasUserTypedRef.current = true;
                setSearchQuery(e.target.value);
              }}
              onFocus={() => {
                if (focusOpenRef.current) window.clearTimeout(focusOpenRef.current);
                focusOpenRef.current = window.setTimeout(() => setOpen(true), 200);
              }}
              prefix={<Search className="size-4" />}
              className="bg-card"
              aria-expanded={open}
              aria-haspopup="listbox"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] max-h-60 overflow-y-auto p-0 bg-card border-border"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ul role="listbox" className="py-1 !bg-card">
            {hasNoMatch && (
              <>
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  No option match what you are looking for...
                </li>
                <li>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-sm cursor-pointer"
                    onClick={handleAddCustom}
                  >
                    <Plus className="size-4 shrink-0" />
                    Add &quot;{searchQuery.trim()}&quot;
                  </button>
                </li>
              </>
            )}
            {!hasNoMatch &&
              filteredOptions.map((opt) => {
                const extra = getExtraPropsForOption(opt, options, optComponentProps);
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      className={optionRowButtonClassName}
                      onClick={() => handleSelect(opt)}
                    >
                      {OptComponent ? (
                        <OptComponent option={opt} {...extra} />
                      ) : (
                        <>
                          <Plus className="size-4 shrink-0" />
                          {opt.label}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <div
              key={item.id}
              className={`group inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-foreground bg-black/10 dark:bg-white/10`}
            >
              {icon != null && (
                <span className="inline-flex shrink-0 [&_svg]:size-4" aria-hidden>
                  {icon}
                </span>
              )}
              <span>{item.label}</span>
              <button
                type="button"
                className="invisible ml-0.5 rounded p-0.5 group-hover:visible focus:visible focus:outline-none hover:bg-muted cursor-pointer"
                onClick={() => handleRemove(item)}
                aria-label={`Remove ${item.label}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
