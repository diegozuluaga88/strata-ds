"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { DateField, DateInput, DateSegment, I18nProvider } from "react-aria-components";
// These are runtime imports and are not re-exported by react-aria-components.
// Keep @internationalized/date direct so consumers do not rely on a transitive package.
import { CalendarDate, parseDate } from "@internationalized/date";
import { type DropdownProps } from "react-day-picker";
import { cn } from '@/utils';
import { Button } from '../application-ui/button';
import { Calendar } from '../application-ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Popover, PopoverContent, PopoverTrigger } from '../overlays/popover';

const YEAR_RANGE = 100;
const THIS_YEAR = new Date().getFullYear();
const START_MONTH = new Date(THIS_YEAR - YEAR_RANGE, 0);
const END_MONTH = new Date(THIS_YEAR + YEAR_RANGE, 11);

function MonthYearDropdown({
  options,
  value,
  onChange,
  className,
  style,
  disabled,
  "aria-label": ariaLabel,
}: DropdownProps): React.ReactElement {
  const selectedValue = value == null ? undefined : String(value);

  return (
    <Select
      value={selectedValue}
      onValueChange={(nextValue) => {
        onChange?.({
          target: { value: nextValue },
        } as React.ChangeEvent<HTMLSelectElement>);
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={className}
        disabled={disabled}
        style={style}
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options?.map((option) => (
          <SelectItem
            key={option.value}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toCalendarDate(value: string | undefined): CalendarDate | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

function calendarDateToJsDate(date: CalendarDate): Date {
  // Local noon, matching the picker's existing YYYY-MM-DD-as-local-date contract.
  return new Date(date.year, date.month - 1, date.day, 12);
}

function jsDateToValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface DatePickerProps {
  /** Value in YYYY-MM-DD format (HTML date input compatible). */
  value?: string;
  /** Called with YYYY-MM-DD when user selects a date. */
  onChange?: (value: string) => void;
  /**
   * @deprecated No longer shown. The segmented trigger displays real mm/dd/yyyy
   * placeholders per segment (react-aria-components' own placeholder behavior)
   * instead of a free-text placeholder string. Kept in the prop type only so
   * existing call sites that still pass it don't get a type error.
   */
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  /** Focus the first editable date segment when the field mounts. */
  autoFocus?: boolean;
  /** Accessible label for the trigger (e.g. "Requested delivery date"). */
  "aria-label"?: string;
  /** ID of element that describes the trigger (e.g. error message). */
  "aria-describedby"?: string;
}

/**
 * Date picker using design-system Calendar in a Popover.
 * Use for any date field; do not use a plain text Input with a date placeholder.
 */
function DatePicker({
  value,
  onChange,
  placeholder: _placeholder,
  id,
  disabled,
  className,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  autoFocus,
}: DatePickerProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const calendarValue = React.useMemo(() => toCalendarDate(value), [value]);
  const selectedDate = calendarValue ? calendarDateToJsDate(calendarValue) : undefined;

  const handleFieldChange = React.useCallback(
    (date: CalendarDate | null) => {
      onChange?.(date ? date.toString() : "");
    },
    [onChange],
  );

  const handleCalendarSelect = React.useCallback(
    (date: Date | undefined) => {
      const nextValue = date ? jsDateToValue(date) : "";
      onChange?.(nextValue);
      setOpen(false);
    },
    [onChange],
  );

  const fieldWrapperStyles = cn(
    // pl-8 matches the trigger button's own w-8 exactly (no extra slack beyond its box),
    // so the calendar icon sits right up against the date segments instead of floating
    // with ~14px of dead space before "mm".
    "relative flex h-9 w-full min-w-0 items-center gap-0 rounded-lg border border-zinc-300 bg-input-background/30 pl-8 pr-4 text-sm text-foreground shadow-sm outline-none transition-all dark:border-zinc-700",
    "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary",
    disabled && "pointer-events-none opacity-50",
    className,
  );

  return (
    <I18nProvider locale="en-US">
      <div className={fieldWrapperStyles}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-slot="date-picker-trigger"
              aria-label="Open calendar"
              disabled={disabled}
              className="absolute inset-y-0 left-0 h-full w-8 rounded-l-lg rounded-r-none text-foreground hover:bg-accent"
            >
              <CalendarIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              navLayout="around"
              startMonth={START_MONTH}
              endMonth={END_MONTH}
              components={{ Dropdown: MonthYearDropdown }}
              selected={selectedDate}
              // Without this the calendar opens on today's month, so the selected day (and
              // the click-it-again deselect gesture) isn't even on screen.
              defaultMonth={selectedDate}
              onSelect={handleCalendarSelect}
            />
            {selectedDate && (
              <div className="border-t border-border p-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs"
                  onClick={() => handleCalendarSelect(undefined)}
                >
                  Clear
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <DateField
          id={id}
          value={calendarValue}
          onChange={handleFieldChange}
          isDisabled={disabled}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          className="flex flex-1 items-center"
        >
          <DateInput className="flex items-center">
            {(segment) => (
              <DateSegment
                segment={segment}
                className={cn(
                  "rounded tabular-nums outline-none",
                  // Literal separators ("/") don't need the numeric segments' own
                  // focus-highlight breathing room; giving them padding too widened the
                  // gap between "mm" and "dd" well past a normal mm/dd/yyyy rhythm.
                  segment.type === "literal" ? "px-0" : "px-0.5",
                  "focus:bg-primary focus:text-primary-foreground",
                  "data-[placeholder]:text-muted-foreground",
                )}
              >
                {({ text, isPlaceholder }) =>
                  isPlaceholder || (segment.type !== "month" && segment.type !== "day")
                    ? text
                    : text ? pad(Number(text)) : text}
              </DateSegment>
            )}
          </DateInput>
        </DateField>
      </div>
    </I18nProvider>
  );
}

export { DatePicker };
