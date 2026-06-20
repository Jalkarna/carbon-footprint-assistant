import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";

describe("EmptyState", () => {
  it("renders the title and description", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="Nothing here yet"
        description="Log an activity to get started."
      />,
    );
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
    expect(
      screen.getByText("Log an activity to get started."),
    ).toBeInTheDocument();
  });

  it("renders a call-to-action link when both label and href are given", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="Empty"
        description="No data."
        actionLabel="Log activity"
        actionHref="/app/log"
      />,
    );
    const link = screen.getByRole("link", { name: "Log activity" });
    expect(link).toHaveAttribute("href", "/app/log");
  });

  it("omits the action when href is missing", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="Empty"
        description="No data."
        actionLabel="Log activity"
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("marks the decorative icon as aria-hidden", () => {
    const { container } = render(
      <EmptyState icon={Inbox} title="Empty" description="No data." />,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
