"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  /** Optional group label; consecutive options sharing a group render together. */
  group?: string;
  description?: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  /** Accessible name when no visible <label> is wired via `id`. */
  ariaLabel?: string;
  ariaDescribedBy?: string;
  placeholder?: string;
  className?: string;
}

/**
 * A fully custom, accessible single-select built on the ARIA listbox pattern.
 *
 * No native `<select>` is used, so the control and its menu are styled
 * consistently across browsers. Keyboard support mirrors the WAI-ARIA
 * Authoring Practices: Enter/Space/Up/Down/Home/End open the list, arrows move
 * the active option, Enter/Space select, Escape closes, and typing jumps to a
 * matching option. Active option is tracked with `aria-activedescendant`.
 */
export function Select({
  options,
  value,
  onChange,
  id,
  ariaLabel,
  ariaDescribedBy,
  placeholder = "Select…",
  className,
}: SelectProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const listboxId = `${baseId}-listbox`;
  const optionId = (i: number) => `${baseId}-option-${i}`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef<{ query: string; timer: number | null }>({
    query: "",
    timer: null,
  });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const openMenu = useCallback(() => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [selectedIndex]);

  const closeMenu = useCallback((focusButton = true) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      onChange(option.value);
      closeMenu();
    },
    [options, onChange, closeMenu],
  );

  // Close when focus/click leaves the component.
  useEffect(() => {
    if (!open) return;
    function onDocPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [open]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = document.getElementById(optionId(activeIndex));
    el?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  // Move focus into the listbox when it opens so arrow keys route there.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const handleTypeahead = useCallback(
    (char: string) => {
      const state = typeahead.current;
      if (state.timer) window.clearTimeout(state.timer);
      state.query += char.toLowerCase();
      state.timer = window.setTimeout(() => {
        state.query = "";
      }, 500);
      const match = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(state.query),
      );
      if (match >= 0) {
        setActiveIndex(match);
        if (!open) selectIndex(match);
      }
    },
    [options, open, selectIndex],
  );

  function onButtonKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Enter":
      case " ":
        event.preventDefault();
        openMenu();
        break;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          handleTypeahead(event.key);
        }
    }
  }

  function onListKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectIndex(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu(false);
        break;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          handleTypeahead(event.key);
        }
    }
  }

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        id={baseId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onButtonKeyDown}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-[var(--r-md)] border px-3 text-sm cursor-pointer",
          "border-[var(--border-strong)] bg-surface-2 text-fg transition-colors",
          "hover:border-[var(--fg-subtle)]",
          open && "border-[var(--accent)]",
        )}
      >
        <span className={cn(!selected && "text-fg-subtle", "truncate")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-fg-muted transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={optionId(activeIndex)}
          aria-label={ariaLabel}
          onKeyDown={onListKeyDown}
          className={cn(
            "scroll-thin animate-fade-in absolute z-50 mt-1.5 max-h-72 w-full overflow-y-auto",
            "rounded-[var(--r-md)] border border-[var(--border-strong)] bg-surface-3 p-1 shadow-[var(--shadow-lg)]",
          )}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            const showGroup =
              option.group && option.group !== options[index - 1]?.group;
            return (
              <li key={option.value} role="presentation">
                {showGroup && (
                  <div
                    role="presentation"
                    className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle"
                  >
                    {option.group}
                  </div>
                )}
                <div
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectIndex(index)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-[var(--r-sm)] px-2 py-1.5 text-sm",
                    isActive ? "bg-[var(--accent-subtle)] text-fg" : "text-fg-muted",
                  )}
                >
                  <span className="flex flex-col">
                    <span className={cn(isSelected && "font-medium text-fg")}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="text-xs text-fg-subtle">
                        {option.description}
                      </span>
                    )}
                  </span>
                  {isSelected && (
                    <Check
                      aria-hidden="true"
                      className="size-4 shrink-0 text-[var(--accent)]"
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
