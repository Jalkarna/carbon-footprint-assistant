import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityForm } from "@/components/ActivityForm";
import { useCarbonStore } from "@/lib/store/carbon-store";

beforeEach(() => {
  useCarbonStore.setState({ activities: [], goal: null });
  localStorage.clear();
});

describe("ActivityForm", () => {
  it("renders accessible labelled controls", () => {
    render(<ActivityForm />);
    expect(screen.getByRole("combobox", { name: /activity/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to log/i })).toBeInTheDocument();
  });

  it("adds a valid activity to the store and clears the amount", async () => {
    const user = userEvent.setup();
    render(<ActivityForm />);

    await user.type(screen.getByLabelText(/amount/i), "12");
    await user.click(screen.getByRole("button", { name: /add to log/i }));

    expect(useCarbonStore.getState().activities).toHaveLength(1);
    expect(screen.getByLabelText(/amount/i)).toHaveValue(null); // cleared
  });

  it("shows an accessible error for an empty quantity", async () => {
    const user = userEvent.setup();
    render(<ActivityForm />);

    await user.click(screen.getByRole("button", { name: /add to log/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/quantity/i);
    expect(useCarbonStore.getState().activities).toHaveLength(0);
  });

  it("updates the amount unit when the activity changes", async () => {
    const user = userEvent.setup();
    render(<ActivityForm />);

    // First factor is a petrol car (km).
    expect(screen.getByLabelText(/amount \(km\)/i)).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /activity/i }),
      "electricity",
    );
    expect(screen.getByLabelText(/amount \(kWh\)/i)).toBeInTheDocument();
  });
});
