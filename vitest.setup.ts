import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom does not implement layout APIs that some accessible widgets call (e.g.
// keeping the active option in view). Provide a no-op so those components can
// be unit-tested without errors.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Ensure the DOM is reset between component tests.
afterEach(() => {
  cleanup();
});
