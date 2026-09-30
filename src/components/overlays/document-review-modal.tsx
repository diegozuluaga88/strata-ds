import * as React from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './dialog';

/**
 * DocumentReviewModal — large-format review canvas for extracted document data.
 *
 * A composable shell built around the canonical pattern observed in
 * inbound-outbound (BFIDocumentReviewModal 3,458 LOC,
 * OfficeworksDocumentReviewModal), quote-converter (deployed app), and
 * smart-comparator. Centralises:
 *   - Modal shell (max-width 1400px, card surface, scrollable body)
 *   - Header with sparkle icon + title + subtitle + actions slot + status slot + close
 *   - Underline-style tab strip with optional count badges
 *   - Footer with confidence indicator + actions
 *
 * The body content is fully consumer-controlled (children) so the modal can
 * host any combination of FieldSection blocks, EditableLineTable, charts, etc.
 *
 * Replaces ~3,000+ LOC duplicated across consumer modals.
 */

export interface DocumentReviewTab<TKey extends string = string> {
  key: TKey;
  label: string;
  count?: number;
}

export interface DocumentReviewModalProps<TKey extends string = string> {
  open: boolean;
  onClose: () => void;

  title: string;
  subtitle?: string;
  /** Right-aligned header actions (View PDF button, kebab menu, etc). */
  headerActions?: React.ReactNode;
  /** Status badge / pill rendered between actions and close. */
  status?: React.ReactNode;

  tabs?: DocumentReviewTab<TKey>[];
  activeTab?: TKey;
  onTabChange?: (key: TKey) => void;
  /** Action slot rendered to the right of the tab strip (e.g. Export menu). */
  tabBarActions?: React.ReactNode;

  /** Footer content (confidence indicator, Cancel + Save, etc). */
  footer?: React.ReactNode;

  children: React.ReactNode;
}

export function DocumentReviewModal<TKey extends string = string>({
  open,
  onClose,
  title,
  subtitle,
  headerActions,
  status,
  tabs,
  activeTab,
  onTabChange,
  tabBarActions,
  footer,
  children,
}: DocumentReviewModalProps<TKey>) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[min(1400px,95vw)] max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
        {/* a11y */}
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {subtitle && (
          <DialogDescription className="sr-only">{subtitle}</DialogDescription>
        )}

        {/* Header */}
        <header className="flex items-center justify-between gap-3 px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles
              className="h-5 w-5 text-foreground shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="text-lg font-bold text-foreground truncate">
                {title}
              </div>
              {subtitle && (
                <div className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            {status}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Tab bar */}
        {tabs && tabs.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-6 border-b border-border shrink-0">
            <div role="tablist" className="flex items-center gap-6">
              {tabs.map((t) => {
                const isActive = t.key === activeTab;
                return (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={isActive}
                    type="button"
                    onClick={() => onTabChange?.(t.key)}
                    className={cn(
                      'h-12 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors border-b-2',
                      isActive
                        ? 'border-status-success text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t.label}
                    {typeof t.count === 'number' && (
                      <span
                        className={cn(
                          'inline-flex items-center justify-center min-w-[18px] h-5 px-1.5 rounded-full text-[10px] font-bold',
                          isActive
                            ? 'bg-status-success/15 text-status-success'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {tabBarActions && <div className="shrink-0">{tabBarActions}</div>}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-background">{children}</div>

        {/* Footer */}
        {footer && (
          <footer className="px-6 py-4 border-t border-border bg-card flex items-center justify-end gap-3 shrink-0">
            {footer}
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Companion primitives ─────────────────────────────────────────────────

export interface FieldSectionProps {
  /** Heading icon — pass a lucide Icon component or anything. */
  icon?: React.ReactNode;
  /** Uppercase label. */
  label: string;
  /** Field rows or any children. */
  children: React.ReactNode;
  className?: string;
}

/**
 * FieldSection — bordered block with an icon + uppercase label + content.
 * Used for "QUOTE INFO", "VENDOR", "DEALER" sections in document review.
 */
export function FieldSection({
  icon,
  label,
  children,
  className,
}: FieldSectionProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden',
        className,
      )}
    >
      <header className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
        {icon && (
          <span className="text-muted-foreground shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h4>
      </header>
      <div>{children}</div>
    </section>
  );
}

export interface FieldValueRowProps {
  field: string;
  value: React.ReactNode;
  /** Renders an em-dash when value is undefined/empty. */
  placeholder?: string;
  className?: string;
}

/**
 * FieldValueRow — two-column row inside a FieldSection.
 * Column 1: field label. Column 2: value (or placeholder when empty).
 */
export function FieldValueRow({
  field,
  value,
  placeholder = '—',
  className,
}: FieldValueRowProps) {
  const isEmpty =
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);
  return (
    <div
      className={cn(
        'grid grid-cols-[160px_1fr] gap-4 px-4 py-3 border-b border-border last:border-b-0',
        className,
      )}
    >
      <div className="text-xs text-muted-foreground">{field}</div>
      <div className="text-sm text-foreground">
        {isEmpty ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

export interface ConfidenceIndicatorProps {
  /** Percentage 0-100. */
  value: number;
  className?: string;
}

/**
 * ConfidenceIndicator — single text + optional bar showing OCR confidence.
 * Color-coded: <60 destructive, 60-79 warning, 80+ success.
 */
export function ConfidenceIndicator({ value, className }: ConfidenceIndicatorProps) {
  const tone =
    value >= 80 ? 'text-status-success' : value >= 60 ? 'text-status-warning' : 'text-destructive';
  return (
    <span
      className={cn(
        'text-xs font-medium tabular-nums',
        tone,
        className,
      )}
    >
      {value}% confidence
    </span>
  );
}
