import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { BreakdownChart } from "@/components/BreakdownChart";
import { InsightList } from "@/components/InsightList";
import type { Insight } from "@/lib/insights/analyze";

describe("BreakdownChart", () => {
  it("renders an accessible table with a row per category", () => {
    render(
      <BreakdownChart
        byCategory={{ transport: 5, energy: 2, diet: 3, shopping: 0 }}
        total={10}
      />,
    );
    const table = screen.getByRole("table", { name: /by category/i });
    // Row headers expose the category names to assistive tech.
    expect(within(table).getByRole("rowheader", { name: /transport/i })).toBeInTheDocument();
    expect(within(table).getByRole("rowheader", { name: /energy/i })).toBeInTheDocument();
  });

  it("shows percentage shares", () => {
    render(
      <BreakdownChart
        byCategory={{ transport: 5, energy: 0, diet: 5, shopping: 0 }}
        total={10}
      />,
    );
    // Two categories at 50% each.
    expect(screen.getAllByText(/50%/)).toHaveLength(2);
  });
});

describe("InsightList", () => {
  const insights: Insight[] = [
    {
      id: "headline",
      level: "info",
      title: "Diet is your biggest source",
      detail: "Diet makes up 70% of your footprint.",
    },
    {
      id: "diet-redmeat",
      level: "opportunity",
      title: "Swap a few red-meat meals",
      detail: "Swapping saves emissions.",
      potentialSavingKg: 14.4,
    },
  ];

  it("renders each insight with its level badge", () => {
    render(<InsightList insights={insights} />);
    const list = screen.getByRole("list", { name: /insights/i });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Insight")).toBeInTheDocument();
    expect(screen.getByText("Opportunity")).toBeInTheDocument();
  });

  it("surfaces a quantified saving when present", () => {
    render(<InsightList insights={insights} />);
    expect(screen.getByText(/Potential saving/i)).toHaveTextContent(/14/);
  });

  it("renders nothing when there are no insights", () => {
    const { container } = render(<InsightList insights={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
