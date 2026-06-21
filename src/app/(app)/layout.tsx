import { Sidebar } from "@/components/nav/Sidebar";
import { MobileNav } from "@/components/nav/MobileNav";
import { MobileHeader } from "@/components/nav/MobileHeader";

/**
 * Application shell shared by every /app route.
 *
 * Desktop: a fixed sidebar on the left, scrollable content on the right.
 * Mobile: a compact top header and a bottom tab bar, with the content between.
 * The main region is the page's primary landmark and the skip-link target.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 md:block">
        <Sidebar />
      </aside>

      {/* Mobile header */}
      <MobileHeader />

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          id="main"
          className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-12 md:pt-8"
        >
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
