"use client";

import { Trash2 } from "lucide-react";
import { computeActivities } from "@/lib/emissions/calculate";
import { CATEGORY_META } from "@/lib/emissions/factors";
import { useCarbonStore } from "@/lib/store/carbon-store";
import { formatKg } from "@/components/ui";
import { FACTOR_ICON, CATEGORY_COLOR_VAR } from "@/components/charts/icons";

/**
 * List of logged activities, newest first, each with a remove control whose
 * accessible name identifies the specific entry. An optional `limit` trims the
 * list for compact dashboard placement.
 */
export function ActivityList({ limit }: { limit?: number }) {
  const activities = useCarbonStore((s) => s.activities);
  const removeActivity = useCarbonStore((s) => s.removeActivity);

  const computed = computeActivities(activities);
  const shown = limit ? computed.slice(0, limit) : computed;

  if (shown.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-fg-muted">
        No activities logged yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-[var(--border-faint)]" aria-label="Logged activities">
      {shown.map((activity) => {
        const Icon = FACTOR_ICON[activity.factorId] ?? FACTOR_ICON.electricity;
        return (
          <li
            key={activity.id}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-surface-3"
            >
              <Icon
                className="size-4"
                style={{ color: CATEGORY_COLOR_VAR[activity.category] }}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">
                {activity.label}
              </p>
              <p className="text-xs text-fg-subtle">
                {activity.quantity} {activity.unit} ·{" "}
                {CATEGORY_META[activity.category].label} · {activity.date}
              </p>
            </div>
            <span className="tnum text-sm font-medium text-fg whitespace-nowrap">
              {formatKg(activity.kgCO2e)}
            </span>
            <button
              type="button"
              onClick={() => removeActivity(activity.id)}
              aria-label={`Remove ${activity.label} on ${activity.date}`}
              className="rounded-[var(--r-sm)] p-1.5 text-fg-subtle transition-colors hover:bg-[var(--critical-subtle)] hover:text-[var(--critical)] cursor-pointer"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
