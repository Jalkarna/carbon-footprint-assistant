import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon?: LucideIcon;
  /** Optional trend chip: negative delta is framed as good (less carbon). */
  delta?: { value: number; goodWhenNegative?: boolean };
  hint?: string;
}

/**
 * A single headline metric. The optional delta is colour- and arrow-coded, and
 * because lower emissions are better, a negative delta is treated as positive.
 */
export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  delta,
  hint,
}: StatCardProps) {
  const good =
    delta &&
    (delta.goodWhenNegative ?? true ? delta.value <= 0 : delta.value >= 0);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-fg-muted">{label}</p>
        {Icon && <Icon aria-hidden="true" className="size-4 text-fg-subtle" />}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="tnum text-3xl font-bold tracking-tight text-fg">
          {value}
        </span>
        {unit && <span className="text-sm text-fg-muted">{unit}</span>}
      </div>
      {delta && (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-sm font-medium",
            good ? "text-[var(--positive)]" : "text-[var(--caution)]",
          )}
        >
          {delta.value <= 0 ? (
            <ArrowDown aria-hidden="true" className="size-3.5" />
          ) : (
            <ArrowUp aria-hidden="true" className="size-3.5" />
          )}
          <span>{Math.abs(delta.value)}%</span>
          {hint && <span className="font-normal text-fg-subtle">{hint}</span>}
        </div>
      )}
      {!delta && hint && <p className="mt-2 text-sm text-fg-subtle">{hint}</p>}
    </Card>
  );
}
