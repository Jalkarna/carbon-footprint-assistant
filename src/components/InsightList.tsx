import type { Insight, InsightLevel } from "@/lib/insights/analyze";
import { formatKg } from "./ui";

const LEVEL_STYLE: Record<
  InsightLevel,
  { bg: string; fg: string; label: string }
> = {
  win: { bg: "bg-win-bg", fg: "text-win", label: "Win" },
  opportunity: {
    bg: "bg-opportunity-bg",
    fg: "text-opportunity",
    label: "Opportunity",
  },
  info: { bg: "bg-info-bg", fg: "text-info", label: "Insight" },
};

/**
 * Renders the deterministic engine's recommendations as a list.
 *
 * Each card is a list item with a clear, colour-and-text-coded level badge (so
 * meaning is not conveyed by colour alone), the advice, and a quantified
 * potential saving where one was computed.
 */
export function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <ul className="space-y-3" aria-label="Personalized insights">
      {insights.map((insight) => {
        const style = LEVEL_STYLE[insight.level];
        return (
          <li
            key={insight.id}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold">{insight.title}</h3>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.fg}`}
              >
                {style.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{insight.detail}</p>
            {typeof insight.potentialSavingKg === "number" &&
              insight.potentialSavingKg > 0 && (
                <p className="mt-2 text-sm font-medium text-win">
                  Potential saving: {formatKg(insight.potentialSavingKg)} CO2e
                </p>
              )}
          </li>
        );
      })}
    </ul>
  );
}
