import { CATEGORY_META } from "../emissions/factors";
import { summarize, computeActivities, round } from "../emissions/calculate";
import type { Activity, Category } from "../emissions/types";
import { BENCHMARKS } from "./benchmarks";
import { RULES, type Insight, type RuleContext } from "./rules";

// Re-export the public surface so consumers depend on a single, stable entry
// point (`@/lib/insights/analyze`) regardless of the internal file split.
export { BENCHMARKS } from "./benchmarks";
export type { Insight, InsightLevel } from "./rules";

/** The full analysis surfaced to the UI and fed to the AI assistant as context. */
export interface FootprintAnalysis {
  readonly totalKg: number;
  readonly byCategory: Record<Category, number>;
  readonly activityCount: number;
  /** Category contributing the most emissions, if any activities exist. */
  readonly topCategory: {
    category: Category;
    kg: number;
    share: number;
  } | null;
  /** Daily average over the days the user actually logged. */
  readonly dailyAverageKg: number;
  /** How the daily average compares to the benchmarks. */
  readonly comparison: {
    vsGlobalPct: number; // negative = below average (good)
    vsTarget: "under" | "over";
  };
  readonly insights: Insight[];
}

/** Count distinct ISO dates present in the activity log. */
function distinctDays(activities: readonly Activity[]): number {
  return new Set(activities.map((a) => a.date)).size;
}

/** The single biggest-contributing category, or `null` when nothing is logged. */
function findTopCategory(
  byCategory: Record<Category, number>,
  totalKg: number,
): FootprintAnalysis["topCategory"] {
  let top: FootprintAnalysis["topCategory"] = null;
  for (const [category, kg] of Object.entries(byCategory) as [
    Category,
    number,
  ][]) {
    if (kg <= 0) continue;
    if (!top || kg > top.kg) {
      top = {
        category,
        kg,
        share: totalKg > 0 ? round((kg / totalKg) * 100) : 0,
      };
    }
  }
  return top;
}

/**
 * Analyse a user's activities into a structured, explainable footprint.
 *
 * This is the deterministic core of the "smart assistant": all numbers and
 * recommendations originate here so they are reproducible and testable. The AI
 * layer narrates this analysis; it never fabricates the underlying figures.
 */
export function analyzeFootprint(
  activities: readonly Activity[],
): FootprintAnalysis {
  const summary = summarize(activities);
  const computed = computeActivities(activities);
  const days = Math.max(1, distinctDays(computed));
  const dailyAverageKg = round(summary.totalKg / days);
  const topCategory = findTopCategory(summary.byCategory, summary.totalKg);

  const vsGlobalPct =
    BENCHMARKS.globalDailyAvg > 0
      ? round(
          ((dailyAverageKg - BENCHMARKS.globalDailyAvg) /
            BENCHMARKS.globalDailyAvg) *
            100,
        )
      : 0;

  const ctx: RuleContext = {
    byCategory: summary.byCategory,
    totalKg: summary.totalKg,
    computed,
    dailyAverageKg,
  };

  const insights = RULES.map((rule) => rule(ctx)).filter(
    (i): i is Insight => i !== null,
  );

  // Always give the user a clear headline about where they stand.
  if (summary.activityCount === 0) {
    insights.push({
      id: "empty",
      level: "info",
      title: "Log your first activity",
      detail:
        "Add a trip, a meal, or your energy use to see your footprint and get personalized tips.",
    });
  } else if (topCategory) {
    insights.unshift({
      id: "headline",
      level: "info",
      category: topCategory.category,
      title: `${CATEGORY_META[topCategory.category].label} is your biggest source`,
      detail: `${CATEGORY_META[topCategory.category].label} makes up ${topCategory.share}% of your logged footprint. Focusing here gives you the most leverage.`,
    });
  }

  // Sort by impact: bigger estimated savings first, info headline stays on top.
  insights.sort((a, b) => {
    if (a.id === "headline") return -1;
    if (b.id === "headline") return 1;
    return (b.potentialSavingKg ?? 0) - (a.potentialSavingKg ?? 0);
  });

  return {
    totalKg: summary.totalKg,
    byCategory: summary.byCategory,
    activityCount: summary.activityCount,
    topCategory,
    dailyAverageKg,
    comparison: {
      vsGlobalPct,
      vsTarget:
        dailyAverageKg <= BENCHMARKS.sustainableDailyTarget ? "under" : "over",
    },
    insights,
  };
}
