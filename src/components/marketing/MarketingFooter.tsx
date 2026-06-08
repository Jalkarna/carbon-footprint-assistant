import Link from "next/link";
import { Logo } from "@/components/nav/Logo";
import { INFO_NAV } from "@/components/nav/nav-config";

/** Marketing site footer with brand, links, and the educational disclaimer. */
export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-bg-subtle">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo href="/" />
          <nav aria-label="Footer" className="flex flex-wrap gap-4">
            {INFO_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-fg-muted transition-colors hover:text-fg"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/app"
              className="text-sm text-fg-muted transition-colors hover:text-fg"
            >
              Open app
            </Link>
          </nav>
        </div>
        <p className="mt-6 max-w-2xl text-xs text-fg-subtle">
          Carbon provides educational estimates using public emission factors —
          not a certified carbon audit. Your data is stored locally in your
          browser and never leaves your device except when you ask the assistant
          a question.
        </p>
      </div>
    </footer>
  );
}
