import * as React from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { cn } from '@/utils';
import { Button } from '../application-ui/button';

export interface InputProps extends Omit<React.ComponentProps<"input">, "prefix"> {
  /** Optional label rendered above the input */
  label?: string;
  /** Icon or content rendered inside the input on the left (e.g. Search icon) */
  prefix?: React.ReactNode;
  /** Icon or content rendered inside the input on the right (e.g. chevron, clear) */
  suffix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, prefix: prefixSlot, suffix, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const isPassword = type === "password";
    const effectiveType = isPassword && showPassword ? "text" : type;
    const effectiveSuffix = isPassword ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShowPassword(!showPassword)}
        className="pointer-events-auto cursor-pointer text-muted-foreground"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeSlashIcon className="size-4 !w-full" />
        ) : (
          <EyeIcon className="size-4 !w-full" />
        )}
      </Button>
    ) : suffix;

    const hasPrefix = prefixSlot !== undefined;
    const hasSuffix = effectiveSuffix !== undefined;
    const hasSlot = hasPrefix || hasSuffix;

    const inputClasses = cn(
      "flex h-9 w-full min-w-0 rounded-lg border border-input bg-input-background/30 pl-10 pr-4 py-2 text-sm text-foreground shadow-sm outline-none transition-all",
      "placeholder:text-muted-foreground",
      "focus:border-primary focus:ring-2 focus:ring-primary",
      "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
      "selection:bg-primary/20 selection:text-foreground",
      "disabled:pointer-events-none disabled:opacity-50",
      "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
      !hasPrefix && "pl-4",
      hasSuffix && "pr-10",
      className,
    );

    const inputElement = (
      <>
        {hasSlot ? (
          <div className="relative w-inherit">
            <input
              type={effectiveType}
              data-slot="input"
              className={inputClasses}
              ref={ref}
              {...props}
            />
            {hasPrefix && (
              <div
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground [&_svg]:size-4"
                aria-hidden
              >
                {prefixSlot}
              </div>
            )}
            {hasSuffix && (
              <div
                className={cn(
                  "absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground [&_svg]:size-4",
                  !isPassword && "pointer-events-none",
                )}
                aria-hidden={!isPassword}
              >
                {effectiveSuffix}
              </div>
            )}
          </div>
        ) : (
          <input
            type={effectiveType}
            data-slot="input"
            className={inputClasses}
            ref={ref}
            {...props}
          />
        )}
      </>
    );

    if (label) {
      return (
        <>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {label}
          </label>
          {inputElement}
        </>
      );
    }

    return inputElement;
  },
);

Input.displayName = "Input";

export { Input };
