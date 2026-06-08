import type { Category, EmissionFactor } from "./types";

/**
 * Emission factors expressed in kg CO2e per unit.
 *
 * Values are rounded, representative figures drawn from public datasets so the
 * results are realistic and auditable. They are deliberately conservative and
 * are documented per-factor via the `source` field. These are estimates for
 * educational guidance, not a certified carbon audit (see README assumptions).
 *
 * Primary references:
 *  - UK DEFRA / DESNZ greenhouse gas conversion factors (2024)
 *  - US EPA emission factors for greenhouse gas inventories
 *  - Poore & Nemecek (2018), "Reducing food's environmental impacts", Science
 */
export const EMISSION_FACTORS: readonly EmissionFactor[] = [
  // ---- Transport (per km unless noted) ----
  {
    id: "car_petrol",
    category: "transport",
    label: "Petrol car",
    unit: "km",
    perUnitKg: 0.17,
    hint: "Average petrol car, per km driven (single occupant).",
    source: "UK DEFRA 2024 average petrol car",
  },
  {
    id: "car_electric",
    category: "transport",
    label: "Electric car",
    unit: "km",
    perUnitKg: 0.05,
    hint: "Battery electric car, per km, grid-average electricity.",
    source: "UK DEFRA 2024 battery electric vehicle",
  },
  {
    id: "bus",
    category: "transport",
    label: "Bus",
    unit: "km",
    perUnitKg: 0.1,
    hint: "Local bus, per passenger-km.",
    source: "UK DEFRA 2024 average local bus",
  },
  {
    id: "train",
    category: "transport",
    label: "Train",
    unit: "km",
    perUnitKg: 0.035,
    hint: "National rail, per passenger-km.",
    source: "UK DEFRA 2024 national rail",
  },
  {
    id: "flight_short",
    category: "transport",
    label: "Short-haul flight",
    unit: "km",
    perUnitKg: 0.246,
    hint: "Short-haul flight, per passenger-km (incl. radiative forcing).",
    source: "UK DEFRA 2024 short-haul, with RF uplift",
  },
  {
    id: "bike_walk",
    category: "transport",
    label: "Bike / walk",
    unit: "km",
    perUnitKg: 0,
    hint: "Human-powered travel. Zero operational emissions.",
    source: "No direct combustion emissions",
  },

  // ---- Home energy ----
  {
    id: "electricity",
    category: "energy",
    label: "Electricity",
    unit: "kWh",
    perUnitKg: 0.4,
    hint: "Grid electricity, per kWh (grid-average mix).",
    source: "EPA / DEFRA 2024 grid-average electricity",
  },
  {
    id: "natural_gas",
    category: "energy",
    label: "Natural gas",
    unit: "kWh",
    perUnitKg: 0.18,
    hint: "Natural gas heating, per kWh of gas burned.",
    source: "UK DEFRA 2024 natural gas",
  },

  // ---- Diet (per meal) ----
  {
    id: "meal_beef",
    category: "diet",
    label: "Beef / lamb meal",
    unit: "meal",
    perUnitKg: 6.6,
    hint: "A meal centred on red meat.",
    source: "Poore & Nemecek 2018, ruminant meat per serving",
  },
  {
    id: "meal_poultry",
    category: "diet",
    label: "Poultry / pork meal",
    unit: "meal",
    perUnitKg: 1.8,
    hint: "A meal centred on white meat.",
    source: "Poore & Nemecek 2018, poultry per serving",
  },
  {
    id: "meal_vegetarian",
    category: "diet",
    label: "Vegetarian meal",
    unit: "meal",
    perUnitKg: 0.9,
    hint: "A plant-based meal with dairy or eggs.",
    source: "Poore & Nemecek 2018, vegetarian per serving",
  },
  {
    id: "meal_vegan",
    category: "diet",
    label: "Vegan meal",
    unit: "meal",
    perUnitKg: 0.7,
    hint: "An entirely plant-based meal.",
    source: "Poore & Nemecek 2018, vegan per serving",
  },

  // ---- Shopping (per item / per USD) ----
  {
    id: "clothing_item",
    category: "shopping",
    label: "New clothing item",
    unit: "item",
    perUnitKg: 15,
    hint: "An average new garment, cradle-to-gate.",
    source: "Industry LCA average, new garment",
  },
  {
    id: "electronics_spend",
    category: "shopping",
    label: "Electronics spend",
    unit: "USD",
    perUnitKg: 0.5,
    hint: "Consumer electronics, per USD spent.",
    source: "EEIO spend-based estimate, electronics",
  },
] as const;

/** Fast lookup of a factor by id. Built once at module load. */
const FACTOR_BY_ID: ReadonlyMap<string, EmissionFactor> = new Map(
  EMISSION_FACTORS.map((factor) => [factor.id, factor]),
);

/** Return the factor with the given id, or `undefined` if it does not exist. */
export function getFactor(id: string): EmissionFactor | undefined {
  return FACTOR_BY_ID.get(id);
}

/** Display metadata for each category, used for labels and colours in the UI. */
export const CATEGORY_META: Record<
  Category,
  { label: string; description: string }
> = {
  transport: {
    label: "Transport",
    description: "Getting around — car, transit, flights, cycling.",
  },
  energy: {
    label: "Home energy",
    description: "Electricity and heating used at home.",
  },
  diet: { label: "Diet", description: "The food on your plate." },
  shopping: {
    label: "Shopping",
    description: "Clothes, electronics, and other goods.",
  },
};

/** All categories in a stable display order. */
export const CATEGORIES: readonly Category[] = [
  "transport",
  "energy",
  "diet",
  "shopping",
];
