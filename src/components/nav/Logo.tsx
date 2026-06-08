import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The Carbon wordmark: a small leaf glyph drawn in SVG (no emoji) paired with
 * the name. Used in the sidebar, marketing header, and footer.
 */
export function Logo({
  className,
  href = "/",
  showText = true,
}: {
  className?: string;
  href?: string;
  showText?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 font-semibold", className)}
      aria-label="Carbon — home"
    >
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-[var(--r-sm)] border border-[var(--accent-line)] bg-[var(--accent-subtle)]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Leaf */}
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6" />
        </svg>
      </span>
      {showText && <span className="text-fg">Carbon</span>}
    </Link>
  );
}
