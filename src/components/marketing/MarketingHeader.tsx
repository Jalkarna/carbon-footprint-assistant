import Link from "next/link";
import { Logo } from "@/components/nav/Logo";
import { INFO_NAV } from "@/components/nav/nav-config";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Marketing site header: brand, info links, theme toggle, and a primary CTA
 * into the app. Rendered inside a banner landmark.
 */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Logo href="/" />
        <nav aria-label="Site" className="hidden items-center gap-1 md:flex">
          {INFO_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[var(--r-md)] px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/app"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--r-md)] bg-accent px-4 text-sm font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-strong)]"
          >
            Open app
          </Link>
        </div>
      </div>
    </header>
  );
}
