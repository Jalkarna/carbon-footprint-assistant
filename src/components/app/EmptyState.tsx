import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Friendly empty state with an icon, message, and a primary call to action.
 * Used across pages when the user has no logged data yet. The action is a Link
 * styled to match the primary button (avoids nesting a link inside a button).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-[var(--r-lg)] border border-[var(--border)] bg-surface-2"
      >
        <Icon className="size-5 text-fg-muted" />
      </span>
      <div>
        <p className="font-semibold text-fg">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className={cn(
            "mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-[var(--r-md)] px-4 text-sm font-semibold",
            "bg-accent text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-strong)]",
          )}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

