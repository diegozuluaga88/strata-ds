import * as React from 'react';
import { createContext, useCallback, useContext, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { cn } from './utils';
import { Button } from '../application-ui/button';
import { useToastModalGuard } from './feedback-toast-modal-guard';

const DEFAULT_DURATION_MS = 3000;

export type FeedbackToastVariant = 'success' | 'error' | 'warning';

export type FeedbackToastPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

const DEFAULT_TOAST_POSITION: FeedbackToastPosition = 'bottom-left';

export interface FeedbackToastOptions {
  variant: FeedbackToastVariant;
  message: string;
  duration?: number;
  actions?: FeedbackToastAction[];
  /** Screen corner for this toast. Defaults to `bottom-left`. */
  position?: FeedbackToastPosition;
}

interface FeedbackToastContextValue {
  show: (options: FeedbackToastOptions) => void;
  hide: () => void;
}

const FeedbackToastContext = createContext<FeedbackToastContextValue | null>(null);

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- no-op implementation
function noopShow(_opts: FeedbackToastOptions) {
  /* default context no-op */
}
function noopHide() {
  /* default context no-op */
}
const defaultContextValue: FeedbackToastContextValue = { show: noopShow, hide: noopHide };

const feedbackToastVariants = cva(
  'relative flex flex-col max-w-[393px] items-start gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg border-l-4',
  {
    variants: {
      variant: {
        success:
          'bg-[#1e6e22] border-l-emerald-400 dark:bg-emerald-900 dark:border-l-emerald-400',
        error:
          'bg-red-800 border-l-red-400 dark:bg-red-900 dark:border-l-red-400',
        warning:
          'bg-amber-700 border-l-amber-400 dark:bg-amber-800 dark:border-l-amber-400',
      },
    },
    defaultVariants: {
      variant: 'success',
    },
  },
);

export interface FeedbackToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  className?: string;
  disabled?: boolean;
}

export interface FeedbackToastProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof feedbackToastVariants> {
  message: string;
  onClose: () => void;
  actions?: FeedbackToastAction[];
}

function FeedbackToast({
  variant = 'success',
  message,
  onClose,
  actions,
  className,
  ...props
}: FeedbackToastProps) {
  const Icon =
    variant === 'success'
      ? CheckCircle
      : variant === 'error'
        ? XCircle
        : AlertCircle;

  return (
    <div
      role="alert"
      className={cn(feedbackToastVariants({ variant }), className)}
      {...props}
    >

      <div className='relative flex items-start gap-3 w-full'>
        <Icon
          className="size-5 shrink-0 text-white"
          aria-hidden
        />
        <p className="flex-1 pt-0.5 text-white">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded p-0.5 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {actions && actions.length > 0 && (
        <div className='relative flex justify-end gap-3 w-full'>
          {actions?.map((action) => (
            <Button key={action.label} onClick={action.onClick} variant={action.variant} size={'sm'} className={action.className} disabled={action.disabled}>
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export interface FeedbackToastProviderProps {
  children: React.ReactNode;
  /**
   * Sonner theme, forwarded to the shared Toaster this provider mounts. Pass the app's
   * own theme state so every toast — including a raw `toast.success()`/`toast.error()`
   * call made directly against sonner elsewhere in the app — matches light/dark mode.
   * Apps should not mount their own separate `<Toaster>`; this is the only one.
   */
  theme?: 'light' | 'dark' | 'system';
}

function FeedbackToastProvider({ children, theme }: FeedbackToastProviderProps) {
  useToastModalGuard();

  // toast.dismiss() with no argument dismisses every active sonner toast, not just
  // the one being closed. Track the most recently shown toast's id so its own X
  // button and the imperative hide() only ever target that one toast.
  const lastToastIdRef = useRef<string | number | null>(null);

  const show = useCallback((options: FeedbackToastOptions) => {
    const id = toast.custom(
      (toastId) => (
        <FeedbackToast
          variant={options.variant}
          message={options.message}
          actions={options.actions}
          onClose={() => toast.dismiss(toastId)}
        />
      ),
      {
        duration: options.duration ?? DEFAULT_DURATION_MS,
        position: options.position ?? DEFAULT_TOAST_POSITION,
        // Per-call, not on the Toaster's own toastOptions: [data-styled] is
        // `!(toast.unstyled || toasterUnstyled)`, so a Toaster-level default would
        // also strip sonner's default skin from raw toast.success()/error() calls
        // made directly elsewhere in the app, silently defeating richColors for them.
        unstyled: true,
      },
    );
    lastToastIdRef.current = id;
  }, []);

  const hide = useCallback(() => {
    if (lastToastIdRef.current != null) {
      toast.dismiss(lastToastIdRef.current);
    }
  }, []);

  const value = React.useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <FeedbackToastContext.Provider value={value}>
      {children}
      <Toaster
        theme={theme}
        richColors
        position={DEFAULT_TOAST_POSITION}
        className="ds-feedback-toaster"
        style={{ pointerEvents: 'auto' }}
        toastOptions={{ style: { pointerEvents: 'auto' } }}
      />
    </FeedbackToastContext.Provider>
  );
}

function useFeedbackToast(): FeedbackToastContextValue {
  const ctx = useContext(FeedbackToastContext);
  return ctx ?? defaultContextValue;
}

export { FeedbackToast, FeedbackToastProvider, feedbackToastVariants, useFeedbackToast };
