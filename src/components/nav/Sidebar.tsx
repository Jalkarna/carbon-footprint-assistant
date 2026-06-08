"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { APP_NAV, INFO_NAV } from "./nav-config";
import { Logo } from "./Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";

/** Returns true when `href` matches the current path (exact for /app root). */
function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Persistent desktop sidebar: brand, primary navigation with active state, and
 * secondary info links. Rendered inside a <nav> landmark for screen readers.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r border-[var(--border)] bg-bg-subtle">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo href="/app" />
        <ThemeToggle />
      </div>

      <nav aria-label="Primary" className="flex-1 px-3 py-2">
        <ul className="flex flex-col gap-1">
          {APP_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-[var(--r-md)] px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-[var(--accent-subtle)] font-medium text-fg"
                      : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-[var(--accent)]" : "text-fg-subtle",
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--border)] px-3 py-3">
        <ul className="flex flex-col gap-1">
          {INFO_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between rounded-[var(--r-md)] px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                {item.label}
                <ArrowUpRight aria-hidden="true" className="size-3.5 text-fg-subtle" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
