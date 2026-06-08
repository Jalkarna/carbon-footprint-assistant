"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/cn";

/**
 * A compact theme switch. Shows the current theme's icon and toggles between
 * dark and light. The button label updates so screen readers announce the
 * action it will perform.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-[var(--r-md)] border border-[var(--border)] cursor-pointer",
        "text-fg-muted transition-colors hover:border-[var(--border-strong)] hover:text-fg",
        className,
      )}
    >
      {theme === "dark" ? (
        <Moon aria-hidden="true" className="size-4" />
      ) : (
        <Sun aria-hidden="true" className="size-4" />
      )}
    </button>
  );
}
