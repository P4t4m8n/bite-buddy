import { CircleCheck, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

const DISMISS_AFTER_MS = 6000;

export type ToastMessage = { id: number; text: string; href?: string; linkLabel?: string };

type ToastProps = { toast: ToastMessage | null; onDismiss: () => void };

/**
 * A short confirmation above the bottom navigation. The live region is always rendered
 * so screen readers announce new messages.
 */
export default function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-20 mx-auto max-w-md pb-[env(safe-area-inset-bottom)]"
    >
      {toast ? (
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-foreground px-4 py-3 text-sm text-background shadow-lg">
          <CircleCheck aria-hidden className="size-5 shrink-0 text-brand" />
          <p className="min-w-0 flex-1">{toast.text}</p>
          {toast.href ? (
            <Link href={toast.href} className="shrink-0 font-medium text-brand">
              {toast.linkLabel}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="סגירת ההודעה"
            className="shrink-0 opacity-60 hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
