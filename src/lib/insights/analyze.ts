import { CATEGORY_META, getFactor } from "../emissions/factors";
import { summarize, computeActivities, round } from "../emissions/calculate";
import type { Activity, Category } from "../emissions/types";

/**
 * Per-unit kg CO2e saved by swapping a higher-carbon activity for a
 * lower-carbon one, derived from the canonical emission factors.
 *
 * Deriving the delta from {@link getFactor} keeps the recommendation engine in
 * lock-step with the single source of truth: when a factor in `factors.ts`
 * changes, the suggested savings update automatically instead of silently
 * drifting from a hardcoded constant. Returns `0` if either factor is unknown
 * or the swap would not reduce emissions.
 */
function swapSavingPerUnit(fromFactorId: string, toFactorId: string): number {
  const from = getFactor(fromFactorId)?.perUnitKg ?? 0;
  const to = getFactor(toFactorId)?.perUnitKg ?? 0;
  return Math.max(0, from - to);
}

/**
 * Heuristics used by the suggestion rules. These are deliberately conservative
 * behavioural assumptions (not emission factors), named so their intent is
 * explicit and they can be tuned in one place.
 */
const HEURISTICS = {
  /** Share of petrol-car distance assumed realistically shiftable to transit. */
  carDistanceShiftedToTransit: 0.3,
  /** Typical share of home energy saved by efficiency measures (~15%). */
  homeEnergyEfficiencySaving: 0.15,
  /** Share of short-haul flight distance plausibly replaceable by rail. */
  flightDistanceReplaceableByRail: 0.5,
  /** Footprint avoided by buying second-hand / repairing instead of new (~50%). */
  clothingSecondhandSaving: 0.5,
} as const;

/** Sum the quantity logged across one or more factor ids. */
function sumQuantity(
  computed: ReturnType<typeof computeActivities>,
  ...factorIds: string[]
): number {
  const wanted = new Set(factorIds);
  return computed.reduce(
    (total, a) => (wanted.has(a.factorId) ? total + a.quantity : total),
    0,
  );
}

/**
 * Reference daily footprint benchmarks in kg CO2e.
 *
 * These let the assistant put a user's number in context ("you're below the
 * global average") instead of showing a bare figure. Derived from the common
 * estimate that the global average is ~4 t/yr and a Paris-aligned target is
 * ~2 t/yr per person.
 */
export const BENCHMARKS = {
  /** Global average per-person footprint, per day. */
  globalDailyAvg: round(4000 / 365), // ~10.96 kg/day
  /** A climate-friendly per-person target, per day. */
  sustainableDailyTarget: round(2000 / 365), // ~5.48 kg/day
} as const;

export type InsightLevel = "win" | "opportunity" | "info";

/** A single piece of personalized guidance produced by the engine. */
export interface Insight {
  readonly id: string;
  readonly level: InsightLevel;
  readonly title: string;
  readonly detail: string;
  /** Estimated kg CO2e/period saved if the suggestion is followed, if known. */
  readonly potentialSavingKg?: number;
  readonly category?: Category;
}

/** The full analysis surfaced to the UI and fed to the AI assistant as context. */
export interface FootprintAnalysis {
  readonly totalKg: number;
  readonly byCategory: Record<Category, number>;
  readonly activityCount: number;
  /** Category contributing the most emissions, if any activities exist. */
  readonly topCategory: { category: Category; kg: number; share: number } | null;
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

/**
 * Rules that turn a footprint into concrete, quantified suggestions.
 *
 * Each rule is a pure function of the computed context. They are ordered by
 * impact so the most valuable advice surfaces first. Keeping them as data makes
 * the decision logic transparent and unit-testable — the assistant explains
 * these, it does not invent the numbers.
 */
interface RuleContext {
  byCategory: Record<Category, number>;
  totalKg: number;
  computed: ReturnType<typeof computeActivities>;
  dailyAverageKg: number;
}

type Rule = (ctx: RuleContext) => Insight | null;

const RULES: Rule[] = [
  // High red-meat diet → suggest swaps with a concrete saving.
  (ctx) => {
    const beef = sumQuantity(ctx.computed, "meal_beef");
    if (beef < 1) return null;
    // Saving = each swapped red-meat meal moved to poultry, valued at the
    // canonical factor difference (derived, never hardcoded).
    const saving = round(beef * swapSavingPerUnit("meal_beef", "meal_poultry"));
    return {
      id: "diet-redmeat",
      level: "opportunity",
      category: "diet",
      title: "Swap a few red-meat meals",
      detail: `You logged ${beef} red-meat meal${beef === 1 ? "" : "s"}. Swapping them for poultry or plant-based meals would cut about ${saving} kg CO2e.`,
      potentialSavingKg: saving,
    };
  },

  // Significant petrol-car distance → suggest mode shift.
  (ctx) => {
    const carKm = sumQuantity(ctx.computed, "car_petrol");
    if (carKm < 20) return null;
    // Move a realistic share of those km from petrol car to rail; the per-km
    // saving is the canonical factor difference.
    const shifted = carKm * HEURISTICS.carDistanceShiftedToTransit;
    const saving = round(shifted * swapSavingPerUnit("car_petrol", "train"));
    return {
      id: "transport-modeshift",
      level: "opportunity",
      category: "transport",
      title: "Shift some car trips to transit",
      detail: `You drove ${round(carKm)} km by petrol car. Moving even a third of that to train or bus could save roughly ${saving} kg CO2e.`,
      potentialSavingKg: saving,
    };
  },

  // High electricity → efficiency nudge.
  (ctx) => {
    if (ctx.byCategory.energy < 5) return null;
    const saving = round(
      ctx.byCategory.energy * HEURISTICS.homeEnergyEfficiencySaving,
    );
    return {
      id: "energy-efficiency",
      level: "opportunity",
      category: "energy",
      title: "Trim home energy use",
      detail: `Home energy is ${round(ctx.byCategory.energy)} kg CO2e of your total. Lowering heating by 1°C and switching to LED/efficient appliances can typically shave ~15% (about ${saving} kg).`,
      potentialSavingKg: saving,
    };
  },

  // Air travel is carbon-dense → flag it and quantify a rail alternative.
  (ctx) => {
    const flightKm = sumQuantity(ctx.computed, "flight_short");
    if (flightKm < 300) return null;
    const replaceable = flightKm * HEURISTICS.flightDistanceReplaceableByRail;
    const saving = round(replaceable * swapSavingPerUnit("flight_short", "train"));
    return {
      id: "transport-flights",
      level: "opportunity",
      category: "transport",
      title: "Flights dominate travel emissions",
      detail: `You logged ${round(flightKm)} km of short-haul flights — among the most carbon-dense ways to travel. Taking the train for journeys where it's feasible could save around ${saving} kg CO2e.`,
      potentialSavingKg: saving,
    };
  },

  // Frequent new-clothing purchases → nudge toward second-hand / repair.
  (ctx) => {
    const items = sumQuantity(ctx.computed, "clothing_item");
    if (items < 3) return null;
    const saving = round(ctx.byCategory.shopping * HEURISTICS.clothingSecondhandSaving);
    return {
      id: "shopping-clothing",
      level: "opportunity",
      category: "shopping",
      title: "Buy fewer, longer-lasting clothes",
      detail: `You logged ${items} new clothing item${items === 1 ? "" : "s"}. Buying second-hand, repairing, or choosing durable pieces can roughly halve that impact — about ${saving} kg CO2e.`,
      potentialSavingKg: saving,
    };
  },

  // Recognise low-carbon transport choices as a win.
  (ctx) => {
    const greenKm = sumQuantity(ctx.computed, "bike_walk", "train");
    if (greenKm < 10) return null;
    return {
      id: "transport-win",
      level: "win",
      category: "transport",
      title: "Nice low-carbon travel",
      detail: `You covered ${round(greenKm)} km by train, bike, or on foot. That's a meaningfully lower-carbon choice than driving — keep it up.`,
    };
  },

  // Recognise a plant-forward diet as a win to reinforce the habit.
  (ctx) => {
    const plantMeals = sumQuantity(ctx.computed, "meal_vegetarian", "meal_vegan");
    if (plantMeals < 5) return null;
    return {
      id: "diet-plant-win",
      level: "win",
      category: "diet",
      title: "Plant-forward eating pays off",
      detail: `You logged ${plantMeals} plant-based meals. Vegetarian and vegan meals carry a fraction of the footprint of red meat — a habit worth keeping.`,
    };
  },
];

/**
 * Analyse a user's activities into a structured, explainable footprint.
 *
 * This is the deterministic core of the "smart assistant": all numbers and
 * recommendations originate here so they are reproducible and testable. The AI
 * layer narrates this analysis; it never fabricates the underlying figures.
 */
export function analyzeFootprint(activities: readonly Activity[]): FootprintAnalysis {
  const summary = summarize(activities);
  const computed = computeActivities(activities);
  const days = Math.max(1, distinctDays(computed));
  const dailyAverageKg = round(summary.totalKg / days);

  // Find the single biggest-contributing category.
  let topCategory: FootprintAnalysis["topCategory"] = null;
  for (const [category, kg] of Object.entries(summary.byCategory) as [
    Category,
    number,
  ][]) {
    if (kg <= 0) continue;
    if (!topCategory || kg > topCategory.kg) {
      topCategory = {
        category,
        kg,
        share: summary.totalKg > 0 ? round((kg / summary.totalKg) * 100) : 0,
      };
    }
  }

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
