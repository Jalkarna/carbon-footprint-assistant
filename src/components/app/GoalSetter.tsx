"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import { useCarbonStore } from "@/lib/store/carbon-store";
import { BENCHMARKS } from "@/lib/insights/analyze";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
  Field,
  Input,
  useToast,
} from "@/components/ui";

/**
 * Lets the user set or clear a personal daily target (kg CO2e/day). The target
 * feeds the dashboard goal ring and gives the assistant a reference point.
 */
export function GoalSetter() {
  const goal = useCarbonStore((s) => s.goal);
  const setGoal = useCarbonStore((s) => s.setGoal);
  const { toast } = useToast();
  const [value, setValue] = useState(goal ? String(goal.dailyTargetKg) : "");

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (value.trim() === "") {
      setGoal(null);
      toast("Goal cleared.", "info");
      return;
    }
    const n = Number(value);
    if (Number.isNaN(n) || n < 0) {
      toast("Enter a valid target.", "error");
      return;
    }
    setGoal(n);
    toast(`Daily target set to ${n} kg CO2e.`);
  }

  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <Target aria-hidden="true" className="size-4 text-[var(--accent)]" />
        <div>
          <CardTitle as="h2">Daily target</CardTitle>
          <CardDescription>
            Set a goal to track against.
          </CardDescription>
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={save} className="flex flex-col gap-3">
          <Field
            label="Target (kg CO2e per day)"
            hint={`Climate-friendly target ≈ ${BENCHMARKS.sustainableDailyTarget} kg/day`}
          >
            {(ids) => (
              <Input
                {...ids}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={String(BENCHMARKS.sustainableDailyTarget)}
                className="tnum"
              />
            )}
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Save goal
            </Button>
            {goal && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValue("");
                  setGoal(null);
                  toast("Goal cleared.", "info");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
