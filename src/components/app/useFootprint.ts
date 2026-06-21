"use client";

import { useMemo } from "react";
import { useCarbonStore } from "@/lib/store/carbon-store";
import {
  analyzeFootprint,
  type FootprintAnalysis,
} from "@/lib/insights/analyze";
import { useHydrated } from "@/components/useHydrated";

export interface UseFootprint {
  hydrated: boolean;
  analysis: FootprintAnalysis;
  activityCount: number;
}

/**
 * Convenience hook: subscribes to the activity log and returns the derived,
 * deterministic footprint analysis (memoized), plus a hydration flag so pages
 * can render a stable shell before client state is available.
 */
export function useFootprint(): UseFootprint {
  const hydrated = useHydrated();
  const activities = useCarbonStore((s) => s.activities);
  const analysis = useMemo(() => analyzeFootprint(activities), [activities]);

  return {
    hydrated,
    analysis,
    activityCount: activities.length,
  };
}
