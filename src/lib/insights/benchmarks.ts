import { round } from "../emissions/calculate";

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
