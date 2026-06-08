"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` once the component has mounted on the client.
 *
 * Persisted store state is only available after hydration, so components gate
 * client-only rendering on this to avoid a server/client markup mismatch.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // Detecting client mount is the canonical use of a one-shot effect: there
    // is no external store to subscribe to, we simply flip once after the first
    // client render so persisted (localStorage) state can render without an
    // SSR/client markup mismatch. The lint rule's cascading-render concern does
    // not apply to a single guarded transition.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);
  return hydrated;
}
