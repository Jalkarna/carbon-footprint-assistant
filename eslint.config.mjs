import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Enforce a rigorous TypeScript bar: the strict ruleset catches likely bugs
  // and the stylistic ruleset keeps the codebase idiomatic and consistent.
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  // (Accessibility rules for JSX are already supplied by
  // eslint-config-next/core-web-vitals via eslint-plugin-jsx-a11y; the runtime
  // axe scans in e2e cover the rest.)

  // Test and setup files legitimately use non-null assertions, no-op handlers,
  // dynamic deletes (env scrubbing), and loose typing against mocks; relax the
  // strict rules that would otherwise penalise idiomatic test code.
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "e2e/**/*.ts",
      "test/**/*.ts",
      "vitest.setup.ts",
    ],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-dynamic-delete": "off",
    },
  },

  // Keep eslint-config-prettier last so formatting is owned solely by Prettier
  // and never fights ESLint stylistic rules.
  prettier,

  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / vendored artifacts that should not be linted.
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
