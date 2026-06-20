import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select, type SelectOption } from "@/components/ui/Select";

const options: SelectOption[] = [
  { value: "car", label: "Petrol car", group: "Transport" },
  { value: "train", label: "Train", group: "Transport" },
  { value: "beef", label: "Beef meal", group: "Diet" },
];

describe("Select (ARIA listbox)", () => {
  it("exposes a collapsed combobox button with the placeholder", () => {
    render(
      <Select
        options={options}
        value=""
        onChange={() => {}}
        ariaLabel="Activity"
        placeholder="Choose…"
      />,
    );
    const button = screen.getByRole("button", { name: "Activity" });
    expect(button).toHaveAttribute("aria-haspopup", "listbox");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveTextContent("Choose…");
  });

  it("shows the selected option's label on the button", () => {
    render(
      <Select options={options} value="train" onChange={() => {}} ariaLabel="Activity" />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Train");
  });

  it("opens the listbox on click and renders the options", async () => {
    const user = userEvent.setup();
    render(
      <Select options={options} value="" onChange={() => {}} ariaLabel="Activity" />,
    );
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("selects an option with a pointer click and reports its value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select options={options} value="" onChange={onChange} ariaLabel="Activity" />,
    );
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("option", { name: "Train" }));
    expect(onChange).toHaveBeenCalledWith("train");
  });

  it("supports keyboard selection via arrow keys and Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select options={options} value="" onChange={onChange} ariaLabel="Activity" />,
    );
    const button = screen.getByRole("button");
    button.focus();
    await user.keyboard("{ArrowDown}"); // opens, active = first option
    await user.keyboard("{ArrowDown}"); // move to second option (Train)
    await user.keyboard("{Enter}"); // select
    expect(onChange).toHaveBeenCalledWith("train");
  });

  it("marks the selected option with aria-selected", async () => {
    const user = userEvent.setup();
    render(
      <Select options={options} value="beef" onChange={() => {}} ariaLabel="Activity" />,
    );
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("option", { name: /Beef meal/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("closes on Escape and returns focus to the button", async () => {
    const user = userEvent.setup();
    render(
      <Select options={options} value="" onChange={() => {}} ariaLabel="Activity" />,
    );
    const button = screen.getByRole("button");
    await user.click(button);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("renders group headings only at group boundaries", async () => {
    const user = userEvent.setup();
    render(
      <Select options={options} value="" onChange={() => {}} ariaLabel="Activity" />,
    );
    await user.click(screen.getByRole("button"));
    // Two distinct groups → two headings, not one per option.
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("Diet")).toBeInTheDocument();
  });
});
