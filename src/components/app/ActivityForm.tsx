"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_META,
  EMISSION_FACTORS,
  getFactor,
} from "@/lib/emissions/factors";
import { computeActivity } from "@/lib/emissions/calculate";
import { useCarbonStore } from "@/lib/store/carbon-store";
import { todayISO } from "@/lib/store/helpers";
import { formatKg } from "@/components/ui";
import { Button, Field, Input, Select, useToast, type SelectOption } from "@/components/ui";

/** Build grouped select options from the emission factors. */
const FACTOR_OPTIONS: SelectOption[] = CATEGORIES.flatMap((category) =>
  EMISSION_FACTORS.filter((f) => f.category === category).map((f) => ({
    value: f.id,
    label: f.label,
    group: CATEGORY_META[category].label,
  })),
);

/**
 * Form for logging a new activity. Uses the custom accessible Select (no native
 * dropdown), wires labels/hints/errors via the Field scaffold, shows a live
 * estimate of the resulting emissions, and confirms success with a toast.
 */
export function ActivityForm({ onLogged }: { onLogged?: () => void }) {
  const addActivity = useCarbonStore((s) => s.addActivity);
  const { toast } = useToast();

  const [factorId, setFactorId] = useState(EMISSION_FACTORS[0].id);
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(() => todayISO());
  const [error, setError] = useState<string | undefined>();

  const factor = useMemo(() => getFactor(factorId), [factorId]);

  // Live preview of the emissions this entry would add.
  const preview = useMemo(() => {
    const n = Number(quantity);
    if (!quantity.trim() || Number.isNaN(n) || n < 0) return null;
    const computed = computeActivity({
      id: "preview",
      factorId,
      quantity: n,
      date,
    });
    return computed?.kgCO2e ?? null;
  }, [quantity, factorId, date]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
    setError(undefined);
    toast(
      `Logged ${numeric} ${factor?.unit ?? "unit"} of ${factor?.label ?? "activity"}.`,
    );
    setQuantity("");
    onLogged?.();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Activity" hint={factor?.hint}>
        {({ id, "aria-describedby": describedBy }) => (
          <Select
            id={id}
            ariaDescribedBy={describedBy}
            options={FACTOR_OPTIONS}
            value={factorId}
            onChange={setFactorId}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={`Amount${factor ? ` (${factor.unit})` : ""}`}
          error={error}
        >
          {(ids) => (
            <Input
              {...ids}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 12"
              className="tnum"
            />
          )}
        </Field>

        <Field label="Date">
          {(ids) => (
            <Input
              {...ids}
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-fg-muted" aria-live="polite">
          {preview !== null ? (
            <>
              Adds{" "}
              <span className="tnum font-semibold text-fg">
                {formatKg(preview)} CO2e
              </span>
            </>
          ) : (
            <span className="text-fg-subtle">Enter an amount to preview</span>
          )}
        </p>
        <Button type="submit">
          <Plus aria-hidden="true" className="size-4" />
          Add to log
        </Button>
      </div>
    </form>
  );
}
