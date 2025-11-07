import { cn } from "@/lib/utils";
import { useEffect } from "react";

export function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onOpenChange?.(false);
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className={cn("w-full max-w-lg rounded-lg border bg-background text-foreground shadow-lg")}>{children}</div>
    </div>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("p-4 border-b", className)} {...props} />;
}
export function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}
export function DialogContent({ className, ...props }) {
  return <div className={cn("p-4 space-y-4", className)} {...props} />;
}
export function DialogFooter({ className, ...props }) {
  return <div className={cn("p-4 border-t flex justify-end gap-2", className)} {...props} />;
}
