import { cn } from "@/lib/cn";

/**
 * A surface container with a hairline border. The default raised look is used
 * across the app for grouping content; `interactive` adds a subtle hover for
 * clickable cards.
 */
export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--r-lg)] border border-[var(--border)] bg-surface",
        "shadow-[var(--shadow-sm)]",
        interactive &&
          "transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-0", className)} {...props} />;
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardTitle({
  className,
  as: Tag = "h3",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
  as?: "h2" | "h3" | "h4";
}) {
  return (
    <Tag
      className={cn(
        "text-base font-semibold tracking-tight text-fg",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-sm text-fg-muted", className)} {...props} />
  );
}
