import { Lightbulb, TrendingDown, Trophy, type LucideIcon } from "lucide-react";
import type { Insight, InsightLevel } from "@/lib/insights/analyze";
import { Badge } from "@/components/ui";
import { formatKg } from "@/components/ui";
import { CATEGORY_ICON } from "@/components/charts/icons";

const LEVEL_META: Record<
  InsightLevel,
  { label: string; tone: "positive" | "caution" | "info"; icon: LucideIcon }
> = {
  win: { label: "Win", tone: "positive", icon: Trophy },
  opportunity: { label: "Opportunity", tone: "caution", icon: TrendingDown },
  info: { label: "Insight", tone: "info", icon: Lightbulb },
};

/**
 * Renders the deterministic engine's recommendations as a list of cards. Each
 * card shows a clearly labelled level badge (meaning is not colour-only), the
 * advice text, and the quantified potential saving where one was computed.
 */
export function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <ul className="stagger flex flex-col gap-3" aria-label="Personalized insights">
      {insights.map((insight) => {
        const meta = LEVEL_META[insight.level];
        const CatIcon = insight.category
          ? CATEGORY_ICON[insight.category]
          : meta.icon;
        return (
          <li
            key={insight.id}
            className="rounded-[var(--r-lg)] border border-[var(--border)] bg-surface p-4"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-surface-3"
              >
                <CatIcon className="size-4 text-fg-muted" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-fg">{insight.title}</h3>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
                <p className="mt-1 text-sm text-fg-muted">{insight.detail}</p>
                {typeof insight.potentialSavingKg === "number" &&
                  insight.potentialSavingKg > 0 && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--positive)]">
                      <TrendingDown aria-hidden="true" className="size-3.5" />
                      Save up to {formatKg(insight.potentialSavingKg)} CO2e
                    </p>
                  )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
