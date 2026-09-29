import { useEffect } from 'react';

/** sonner's per-toast element. Scope is deliberately narrow. */
export const DS_SONNER_TOAST_SELECTOR = '[data-sonner-toast]';

/**
 * Keeps a click on a toast from closing the Radix modal behind it.
 *
 * The toast renders outside the dialog's DismissableLayer. Radix disables
 * pointer events document-wide while a modal is open, which the Toaster's
 * `pointer-events: auto` undoes so the X and the action buttons work. That
 * alone hands Radix the opposite problem: it listens for `pointerdown` on
 * `ownerDocument` in the BUBBLE phase (`usePointerDownOutside`), sees a target
 * outside its layer, and dismisses. Closing a toast closed the dialog.
 *
 * This listener runs in the CAPTURE phase on `document`, before the event has
 * descended to the toast, which makes it independent of listener-registration
 * order with Radix's own handlers.
 *
 * Stopping `pointerdown` does not break the toast: `pointerdown` and `click`
 * are separate events and the X and action buttons are driven by `onClick`.
 *
 * Only events originating inside a toast are stopped, so clicking the overlay
 * or anywhere else dismisses the dialog exactly as before.
 */
export function useToastModalGuard(): void {
  useEffect(() => {
    const stopToastPointerDown = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest(DS_SONNER_TOAST_SELECTOR)) {
        event.stopPropagation();
      }
    };

    document.addEventListener('pointerdown', stopToastPointerDown, true);
    return () => document.removeEventListener('pointerdown', stopToastPointerDown, true);
  }, []);
}
