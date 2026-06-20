import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "@/components/ui/Field";

/** Render a Field wrapping a plain input that consumes the wired ids. */
function renderField(props: Partial<React.ComponentProps<typeof Field>> = {}) {
  return render(
    <Field label="Quantity" {...props}>
      {(ids) => <input {...ids} />}
    </Field>,
  );
}

describe("Field", () => {
  it("associates the label with the control", () => {
    renderField();
    // getByLabelText only resolves if htmlFor/id are correctly wired.
    expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
  });

  it("wires a hint via aria-describedby", () => {
    renderField({ hint: "In kilometres" });
    const input = screen.getByLabelText("Quantity");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      "In kilometres",
    );
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("announces an error with role=alert and marks the control invalid", () => {
    renderField({ error: "Required" });
    const input = screen.getByLabelText("Quantity");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Required");
    expect(input.getAttribute("aria-describedby")).toBe(alert.id);
  });

  it("prefers the error over the hint when both are present", () => {
    renderField({ hint: "In kilometres", error: "Too large" });
    expect(screen.getByRole("alert")).toHaveTextContent("Too large");
    expect(screen.queryByText("In kilometres")).not.toBeInTheDocument();
  });

  it("keeps the label available to screen readers when visually hidden", () => {
    renderField({ hideLabel: true });
    const label = screen.getByText("Quantity");
    expect(label).toHaveClass("sr-only");
    // Still associated, so the control remains named.
    expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
  });
});
