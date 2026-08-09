import { config } from "@repo/eslint-config/base";

export default [
  ...config,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        URL: "readonly",
      },
    },
  },
];
