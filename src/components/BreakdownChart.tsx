"use client";

import { CATEGORIES, CATEGORY_META } from "@/lib/emissions/factors";
import type { Category } from "@/lib/emissions/types";
import { CATEGORY_COLOR, formatKg } from "./ui";

interface BreakdownChartProps {
  byCategory: Record<Category, number>;
  total: number;
}

/**
 * Horizontal bar breakdown of emissions by category.
 *
 * Implemented as a semantic table so it is fully understandable to screen
 * readers and works without CSS. The coloured bars are decorative
 * (aria-hidden); the real values live in table cells.
 */
export function BreakdownChart({ byCategory, total }: BreakdownChartProps) {
  const rows = CATEGORIES.map((category) => ({
    category,
    kg: byCategory[category],
    pct: total > 0 ? (byCategory[category] / total) * 100 : 0,
  }));

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">
        Carbon footprint by category, in kilograms of CO2 equivalent
      </caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Emissions</th>
          <th scope="col">Share</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ category, kg, pct }) => (
          <tr key={category}>
            <th
              scope="row"
              className="py-2 pr-3 text-left font-medium align-middle whitespace-nowrap"
            >
              <span
                aria-hidden="true"
                className="inline-block w-3 h-3 rounded-sm mr-2 align-middle"
                style={{ backgroundColor: CATEGORY_COLOR[category] }}
              />
              {CATEGORY_META[category].label}
            </th>
            <td className="py-2 align-middle w-full">
              <div
                className="h-5 rounded-sm bg-surface-muted overflow-hidden"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-sm transition-[width] duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: CATEGORY_COLOR[category],
                    minWidth: pct > 0 ? "0.25rem" : 0,
                  }}
                />
              </div>
            </td>
            <td className="py-2 pl-3 text-right tabular-nums align-middle whitespace-nowrap">
              {formatKg(kg)}
              <span className="text-muted-foreground">
                {" "}
                ({pct.toFixed(0)}%)
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
