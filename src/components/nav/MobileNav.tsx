"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV } from "./nav-config";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Mobile bottom tab bar. Fixed to the viewport bottom on small screens; hidden
 * on desktop where the sidebar takes over.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-bg-subtle/95 backdrop-blur md:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {APP_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs transition-colors",
                  active ? "text-[var(--accent)]" : "text-fg-muted",
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
