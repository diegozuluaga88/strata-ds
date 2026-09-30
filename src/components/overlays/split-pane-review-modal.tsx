import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/utils';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from './dialog';

/**
 * SplitPaneReviewModal — sidebar-aware workflow review modal.
 *
 * Captures the second canonical review-modal shape observed in
 * inbound-outbound: BFIDocumentReviewModal (~3,458 LOC) and
 * OfficeworksDocumentReviewModal (~828 LOC) duplicate the same shell
 * verbatim, distinct from the standard DocumentReviewModal in:
 *   - Sidebar-aware backdrop + content offset (left-80 / left-0)
 *   - Fixed top-0 / bottom-0 positioning (not centered)
 *   - 3/5 + 2/5 split-pane body by default
 *   - AI context banner row between header and body
 *   - Funnel/stepper slot in the header center
 *   - Optional fullContent mode that bypasses the split
 *
 * The shell is consumer-controlled via slots; domain content (floor
 * plans, CPR review, fee verification, etc.) stays in the consumer.
 */

export interface SplitPaneReviewModalProps {
  open: boolean;
  onClose: () => void;

  title: React.ReactNode;
  subtitle?: React.ReactNode;

  /** Slot rendered between subtitle area and close button (e.g. funnel stepper). */
  headerCenter?: React.ReactNode;
  /** Optional extra header actions to the left of the close button. */
  headerActions?: React.ReactNode;

  /** AI context banner row rendered below the header. String or fully-styled node. */
  aiBanner?: React.ReactNode;

  /** Left pane content (3/5 width). Ignored when fullContent is set. */
  leftPane?: React.ReactNode;
  /** Right pane content (2/5 width). Ignored when fullContent is set. */
  rightPane?: React.ReactNode;
  /** When set, replaces the split-pane layout with a full-width body. */
  fullContent?: React.ReactNode;

  /** Footer slot rendered at the bottom (typically a primary CTA). */
  footer?: React.ReactNode;

  /**
   * Tailwind class applied to overlay + content wrapper to leave room for a
   * sidebar (e.g. 'left-80'). Defaults to 'left-0'.
   */
  sidebarOffsetClass?: string;

  /** Override the icon shown in the header (defaults to Sparkles). */
  headerIcon?: React.ReactNode;

  className?: string;
}

export function SplitPaneReviewModal({
  open,
  onClose,
  title,
  subtitle,
  headerCenter,
  headerActions,
  aiBanner,
  leftPane,
  rightPane,
  fullContent,
  footer,
  sidebarOffsetClass = 'left-0',
  headerIcon,
  className,
}: SplitPaneReviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPortal>
        <DialogOverlay
          className={cn(
            'fixed top-0 right-0 bottom-0 inset-y-0',
            sidebarOffsetClass,
            'inset-x-auto',
          )}
          style={{ left: undefined }}
        />
        <div
          className={cn(
            'fixed top-0 right-0 bottom-0 z-50 overflow-y-auto',
            sidebarOffsetClass,
          )}
        >
          <div className="flex min-h-full items-center justify-center p-3">
            <DialogPrimitive.Content
              data-slot="split-pane-review-content"
              className={cn(
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                'w-full max-w-6xl h-[calc(100vh-1.5rem)] rounded-2xl bg-card text-left shadow-2xl border border-border flex flex-col overflow-hidden duration-200',
                className,
              )}
            >
              <DialogTitle className="sr-only">
                {typeof title === 'string' ? title : 'Document review'}
              </DialogTitle>
              {subtitle && typeof subtitle === 'string' && (
                <DialogDescription className="sr-only">
                  {subtitle}
                </DialogDescription>
              )}

              {/* Header */}
              <header className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0 shrink-0">
                  <div className="h-9 w-9 rounded-xl bg-status-ai/10 text-status-ai flex items-center justify-center shrink-0">
                    {headerIcon ?? <Sparkles className="h-5 w-5" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-foreground leading-tight truncate">
                      {title}
                    </h3>
                    {subtitle && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {headerCenter && (
                  <div className="flex-1 flex justify-center min-w-0 overflow-hidden">
                    {headerCenter}
                  </div>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  {headerActions}
                  <DialogPrimitive.Close
                    aria-label="Close"
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </DialogPrimitive.Close>
                </div>
              </header>

              {/* AI banner row */}
              {aiBanner && (
                <div className="px-6 py-2 bg-status-ai/5 border-b border-status-ai/20 flex items-center gap-2 shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-status-ai shrink-0" aria-hidden="true" />
                  <div className="text-[11px] text-status-ai font-medium truncate">
                    {aiBanner}
                  </div>
                </div>
              )}

              {/* Body */}
              {fullContent ? (
                <div className="flex-1 min-h-0 overflow-y-auto bg-muted/10">
                  {fullContent}
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-5 min-h-0">
                  <div className="col-span-3 border-r border-border flex flex-col min-h-0">
                    {leftPane}
                  </div>
                  <div className="col-span-2 flex flex-col min-h-0 overflow-hidden">
                    {rightPane}
                  </div>
                </div>
              )}

              {/* Footer */}
              {footer && (
                <div className="border-t border-border px-5 py-3 bg-card shrink-0">
                  {footer}
                </div>
              )}
            </DialogPrimitive.Content>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
