"use client";

import { computeActivities } from "@/lib/emissions/calculate";
import { CATEGORY_META } from "@/lib/emissions/factors";
import { useCarbonStore } from "@/lib/store/carbon-store";
import { CATEGORY_COLOR, formatKg } from "./ui";

/**
 * A scrollable list of the most recent logged activities with a remove action.
 * Each remove button has an explicit accessible name identifying its row.
 */
export function ActivityList() {
  const activities = useCarbonStore((s) => s.activities);
  const removeActivity = useCarbonStore((s) => s.removeActivity);
  const computed = computeActivities(activities).slice(0, 25);

  if (computed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No activities logged yet. Add one above to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border" aria-label="Recent activities">
      {computed.map((activity) => (
        <li
          key={activity.id}
          className="flex items-center justify-between gap-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">
              <span
                aria-hidden="true"
                className="inline-block w-2.5 h-2.5 rounded-sm mr-2"
                style={{ backgroundColor: CATEGORY_COLOR[activity.category] }}
              />
              {activity.label}
            </p>
            <p className="text-sm text-muted-foreground">
              {activity.quantity} {activity.unit} · {CATEGORY_META[activity.category].label} · {activity.date}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="tabular-nums font-medium whitespace-nowrap">
              {formatKg(activity.kgCO2e)}
            </span>
            <button
              type="button"
              onClick={() => removeActivity(activity.id)}
              className="rounded-md border border-border px-2 py-1 text-sm hover:bg-surface-muted"
              aria-label={`Remove ${activity.label} on ${activity.date}`}
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
