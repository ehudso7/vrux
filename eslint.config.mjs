import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["scripts/**/*.js", "*.config.js", "*.config.mjs", ".next/**", "node_modules/**"]
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true,
        "args": "after-used",
        "caughtErrors": "none"
      }],
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
      "react/no-unescaped-entities": "warn"
    }
  }
];

export default eslintConfig;