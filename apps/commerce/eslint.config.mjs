import { config } from "@repo/eslint-config/base";

export default [
  ...config,
  {
    ignores: [".nitro/**", ".output/**", "coverage/**", "drizzle/meta/**"],
  },
  {
    rules: {
      "turbo/no-undeclared-env-vars": "off",
    },
  },
];
