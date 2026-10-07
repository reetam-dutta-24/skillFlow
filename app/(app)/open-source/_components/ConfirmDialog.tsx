"use client";

import { useId, useRef, type ReactNode } from "react";
import { useFocusTrap } from "@/components/feedback/useFocusTrap";

/** Modal confirmation in the admin dialog style. Focus stays inside; Escape or the backdrop closes it, and focus returns to the trigger. */
export function ConfirmDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open, onClose);

  if (!open) return null;
  return (
    <div className="sf-dialog-backdrop" onMouseDown={onClose}>
      <div
        ref={panelRef}
        className="sf-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
