"use client";

import { useId, useMemo, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_META,
  EMISSION_FACTORS,
  getFactor,
} from "@/lib/emissions/factors";
import { useCarbonStore } from "@/lib/store/carbon-store";
import { todayISO } from "@/lib/store/helpers";

/**
 * Form for logging a new activity.
 *
 * Accessibility: every control has an associated <label>; the helper hint and
 * any validation error are wired via aria-describedby; success and error
 * feedback are announced through a polite live region.
 */
export function ActivityForm() {
  const addActivity = useCarbonStore((s) => s.addActivity);

  const [factorId, setFactorId] = useState<string>(EMISSION_FACTORS[0].id);
  const [quantity, setQuantity] = useState<string>("");
  const [date, setDate] = useState<string>(() => todayISO());
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const ids = {
    factor: useId(),
    quantity: useId(),
    date: useId(),
    hint: useId(),
    error: useId(),
  };

  const factor = useMemo(() => getFactor(factorId), [factorId]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    const numeric = Number(quantity);
    if (quantity.trim() === "" || Number.isNaN(numeric)) {
      setError("Enter a quantity as a number.");
      return;
    }

    const result = addActivity({ factorId, quantity: numeric, date });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setStatus(
      `Logged ${numeric} ${factor?.unit ?? "unit"} of ${factor?.label ?? "activity"}.`,
    );
    setQuantity("");
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby={`${ids.factor}-legend`}>
      <h2 id={`${ids.factor}-legend`} className="text-lg font-semibold mb-4">
        Log an activity
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={ids.factor} className="block text-sm font-medium mb-1">
            Activity
          </label>
          <select
            id={ids.factor}
            value={factorId}
            onChange={(e) => setFactorId(e.target.value)}
            aria-describedby={ids.hint}
            className="w-full rounded-md border border-border bg-surface px-3 py-2"
          >
            {CATEGORIES.map((category) => (
              <optgroup key={category} label={CATEGORY_META[category].label}>
                {EMISSION_FACTORS.filter((f) => f.category === category).map(
                  (f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ),
                )}
              </optgroup>
            ))}
          </select>
          <p id={ids.hint} className="mt-1 text-sm text-muted-foreground">
            {factor?.hint}
          </p>
        </div>

        <div>
          <label
            htmlFor={ids.quantity}
            className="block text-sm font-medium mb-1"
          >
            Amount{factor ? ` (${factor.unit})` : ""}
          </label>
          <input
            id={ids.quantity}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? ids.error : undefined}
            placeholder={`e.g. 12`}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 tabular-nums"
          />
        </div>

        <div>
          <label htmlFor={ids.date} className="block text-sm font-medium mb-1">
            Date
          </label>
          <input
            id={ids.date}
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2"
          />
        </div>
      </div>

      {error && (
        <p
          id={ids.error}
          role="alert"
          className="mt-3 text-sm font-medium text-opportunity"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-hover"
      >
        Add to log
      </button>

      {/* Polite live region announces successful logging to screen readers. */}
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
    </form>
  );
}
