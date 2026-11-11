// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Disallow explicit `any` — use `unknown` and narrow instead
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars only when prefixed with _ (intentional ignores)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Prefer const assertions over type assertions where possible
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
    },
  },
  {
    // Ignore build artifacts and generated files
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/android/**",
      "**/ios/**",
      "**/.turbo/**",
    ],
  }
);
