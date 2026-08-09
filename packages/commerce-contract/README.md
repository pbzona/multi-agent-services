# `@repo/commerce-contract`

The canonical OpenAPI contract for the private commerce service.

- Edit `openapi.yaml` first.
- Run `pnpm openapi:generate` to update generated JSON and TypeScript files.
- Run `pnpm openapi:check` to detect drift.

The Eve connections use the generated contract and apply role-specific
operation allowlists.
