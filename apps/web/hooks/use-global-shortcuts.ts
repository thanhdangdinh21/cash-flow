"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOverlays } from "@/components/shell/overlays-context";
import { isDialogOpen } from "@/lib/dom";

const GO_TARGETS: Record<string, string> = {
  d: "/dashboard",
  t: "/transactions",
  a: "/accounts",
  c: "/categories",
  r: "/reports",
  m: "/contacts",
};

const GO_TIMEOUT_MS = 1500;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * Global keyboard shortcuts for the workbench shell:
 *  - `G` then `D/T/A/C/R/M` (within 1.5s) navigates to the six main routes.
 *  - `N` opens the add-transaction overlay; `T` opens it preset to transfer.
 *  - `A` opens the create-account overlay.
 *  - `Cmd/Ctrl+K` opens the command bar.
 *
 * Ignored while typing in a form field, while any Radix dialog is open, or
 * while a modifier key is held (other than the Cmd/Ctrl+K combo itself).
 * Screen-level handlers should call `stopPropagation` on their own keydown
 * listeners to take precedence over this global one.
 */
export function useGlobalShortcuts() {
  const router = useRouter();
  const overlays = useOverlays();
  const goPending = useRef(false);
  const goTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        overlays.openCommandBar();
        return;
      }

      if (isTypingTarget(e.target) || isDialogOpen() || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();

      if (goPending.current) {
        goPending.current = false;
        clearTimeout(goTimer.current);
        const target = GO_TARGETS[key];
        if (target) {
          e.preventDefault();
          router.push(target);
        }
        return;
      }

      if (key === "g") {
        goPending.current = true;
        goTimer.current = setTimeout(() => {
          goPending.current = false;
        }, GO_TIMEOUT_MS);
        return;
      }

      if (key === "n") {
        e.preventDefault();
        overlays.openAddTransaction();
      } else if (key === "t") {
        e.preventDefault();
        overlays.openAddTransaction("transfer");
      } else if (key === "a") {
        e.preventDefault();
        overlays.openCreateAccount();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(goTimer.current);
    };
  }, [router, overlays]);
}
