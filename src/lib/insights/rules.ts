import { getFactor } from "../emissions/factors";
import { computeActivities, round } from "../emissions/calculate";
import type { Category } from "../emissions/types";

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

/** The pre-computed context every rule receives. Rules never read raw input. */
export interface RuleContext {
  readonly byCategory: Record<Category, number>;
  readonly totalKg: number;
  readonly computed: ReturnType<typeof computeActivities>;
  readonly dailyAverageKg: number;
}

/** A rule is a pure function: context in, at most one insight out. */
export type Rule = (ctx: RuleContext) => Insight | null;

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
export function swapSavingPerUnit(
  fromFactorId: string,
  toFactorId: string,
): number {
  const from = getFactor(fromFactorId)?.perUnitKg ?? 0;
  const to = getFactor(toFactorId)?.perUnitKg ?? 0;
  return Math.max(0, from - to);
}

/** Sum the quantity logged across one or more factor ids. */
export function sumQuantity(
  computed: RuleContext["computed"],
  ...factorIds: string[]
): number {
  const wanted = new Set(factorIds);
  return computed.reduce(
    (total, a) => (wanted.has(a.factorId) ? total + a.quantity : total),
    0,
  );
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

/**
 * The deterministic recommendation rules.
 *
 * Each rule is a pure function of the computed context and fires only when its
 * threshold is met. Keeping them as data — rather than branches buried in one
 * function — makes the decision logic transparent and exhaustively unit-
 * testable. The AI assistant explains these; it never invents the numbers.
 */
export const RULES: readonly Rule[] = [
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

  // High home energy → efficiency nudge.
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
    const saving = round(
      replaceable * swapSavingPerUnit("flight_short", "train"),
    );
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
    const saving = round(
      ctx.byCategory.shopping * HEURISTICS.clothingSecondhandSaving,
    );
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
    const plantMeals = sumQuantity(
      ctx.computed,
      "meal_vegetarian",
      "meal_vegan",
    );
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
