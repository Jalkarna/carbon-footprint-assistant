import type { Category } from "@/lib/emissions/types";

/** Map a category to its CSS custom-property colour token. */
export const CATEGORY_COLOR: Record<Category, string> = {
  transport: "var(--color-cat-transport)",
  energy: "var(--color-cat-energy)",
  diet: "var(--color-cat-diet)",
  shopping: "var(--color-cat-shopping)",
};

/** Format a kg CO2e value for display with its unit. */
export function formatKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`;
  return `${kg.toFixed(kg < 10 ? 1 : 0)} kg`;
}
