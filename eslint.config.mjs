import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Prototype URL/filter sync + select focus reset patterns use setState in effects.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    ignores: [
      "tools/**",
      "content/**",
      "dist/**",
      ".figma/**",
      "node_modules/**",
      ".next/**",
    ],
  },
];

export default eslintConfig;
