import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { InsightList } from "@/components/app/InsightList";
import type { Insight } from "@/lib/insights/analyze";

const insight = (overrides: Partial<Insight> = {}): Insight => ({
  id: "x",
  level: "opportunity",
  title: "Cut your car trips",
  detail: "Driving less saves carbon.",
  ...overrides,
});

describe("InsightList", () => {
  it("renders nothing when there are no insights", () => {
    const { container } = render(<InsightList insights={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders each insight's title and detail", () => {
    render(
      <InsightList
        insights={[
          insight({ id: "a", title: "First tip", detail: "Detail A" }),
          insight({ id: "b", title: "Second tip", detail: "Detail B" }),
        ]}
      />,
    );
    expect(screen.getByText("First tip")).toBeInTheDocument();
    expect(screen.getByText("Second tip")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("labels the list for assistive technology", () => {
    render(<InsightList insights={[insight()]} />);
    expect(
      screen.getByRole("list", { name: /personalized insights/i }),
    ).toBeInTheDocument();
  });

  it("shows a level badge whose meaning is not colour-only", () => {
    render(<InsightList insights={[insight({ level: "win" })]} />);
    // The badge text conveys the level in words, not just colour.
    expect(screen.getByText("Win")).toBeInTheDocument();
  });

  it("shows the quantified saving when a positive potential saving exists", () => {
    render(
      <InsightList insights={[insight({ potentialSavingKg: 14.4 })]} />,
    );
    expect(screen.getByText(/Save up to/i)).toBeInTheDocument();
  });

  it("omits the saving line when there is no positive saving", () => {
    render(<InsightList insights={[insight({ potentialSavingKg: 0 })]} />);
    expect(screen.queryByText(/Save up to/i)).not.toBeInTheDocument();
  });

  it("uses heading semantics for each insight title", () => {
    render(<InsightList insights={[insight({ title: "Heading test" })]} />);
    expect(
      screen.getByRole("heading", { name: "Heading test" }),
    ).toBeInTheDocument();
  });
});
