"use client";

import { Logo } from "./Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Compact top header shown only on mobile (the sidebar replaces it on desktop).
 * Sticky so the brand and theme toggle stay reachable while scrolling.
 */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-bg-subtle/95 px-4 backdrop-blur md:hidden">
      <Logo href="/app" />
      <ThemeToggle />
    </header>
  );
}
