import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Leaf } from "lucide-react";
import { StatCard } from "@/components/app/StatCard";

describe("StatCard", () => {
  it("renders the label, value, and unit", () => {
    render(<StatCard label="Total" value="42" unit="kg" />);
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
  });

  it("shows the delta magnitude without its sign", () => {
    render(<StatCard label="vs last week" value="10" delta={{ value: -12 }} />);
    // Direction is conveyed by the arrow + colour, so the number is unsigned.
    expect(screen.getByText("12%")).toBeInTheDocument();
  });

  it("styles a good delta distinctly from a caution delta", () => {
    // Less carbon is good, so a negative delta and a positive delta must read
    // differently. We compare class output rather than hardcoding token names.
    const good = render(
      <StatCard label="a" value="1" delta={{ value: -12 }} />,
    );
    const goodChip = good.getByText("12%").parentElement?.className;
    good.unmount();

    const caution = render(
      <StatCard label="a" value="1" delta={{ value: 8 }} />,
    );
    const cautionChip = caution.getByText("8%").parentElement?.className;

    expect(goodChip).toBeTruthy();
    expect(goodChip).not.toBe(cautionChip);
  });

  it("inverts the sign convention via goodWhenNegative=false", () => {
    // With the convention inverted, a positive delta should now read the same
    // way a negative delta does under the default convention.
    const defaultGood = render(
      <StatCard label="a" value="1" delta={{ value: -5 }} />,
    );
    const defaultGoodChip =
      defaultGood.getByText("5%").parentElement?.className;
    defaultGood.unmount();

    const inverted = render(
      <StatCard
        label="a"
        value="1"
        delta={{ value: 5, goodWhenNegative: false }}
      />,
    );
    const invertedChip = inverted.getByText("5%").parentElement?.className;

    expect(invertedChip).toBe(defaultGoodChip);
  });

  it("renders a hint without a delta", () => {
    render(<StatCard label="Daily avg" value="3.2" hint="below target" />);
    expect(screen.getByText("below target")).toBeInTheDocument();
  });

  it("renders a decorative icon marked aria-hidden", () => {
    const { container } = render(
      <StatCard label="Total" value="1" icon={Leaf} />,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
