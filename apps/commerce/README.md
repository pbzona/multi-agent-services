# Commerce service

`apps/commerce` owns the private Nitro 3 API, Drizzle schema and migrations, deterministic seed, commerce authorization, and all PostgreSQL access in the workspace.

The Vercel service has no public top-level rewrite. `web`, `eve-customer`, and `eve-admin` reach it only through caller-declared `COMMERCE_URL` bindings.

## Service ownership

| Identifier              | Value                   |
| ----------------------- | ----------------------- |
| Workspace package       | `commerce`              |
| Vercel service          | `commerce`              |
| Framework               | Nitro `3.0.260610-beta` |
| Public rewrite          | None                    |
| Database variable       | `DATABASE_URL`          |
| Shared signing variable | `DEMO_AUTH_SECRET`      |

Bindings grant private reachability, not authorization. Every data route requires a short-lived commerce bearer token.

## Nitro route layout

Standalone Nitro routes for Vercel live under `server/routes/api`. Do not move these handlers to Nitro's shorthand top-level `/api` directory.

| Route                                     | Roles                                                |
| ----------------------------------------- | ---------------------------------------------------- |
| `GET /api/health`                         | Public at the service layer; service remains private |
| `GET /api/openapi.json`                   | Public at the service layer; service remains private |
| `GET /api/v1/products`                    | `web`, `customer`, `admin`                           |
| `GET /api/v1/products/:slug`              | `web`, `customer`, `admin`                           |
| `GET /api/v1/cart`                        | `customer`                                           |
| `PUT /api/v1/cart/items/:variantId`       | `customer`                                           |
| `GET /api/v1/orders`                      | `customer`                                           |
| `GET /api/v1/orders/:orderNumber`         | `customer`                                           |
| `GET /api/v1/admin/inventory`             | `admin`                                              |
| `PATCH /api/v1/admin/products/:productId` | `admin`                                              |
| `PUT /api/v1/admin/inventory/:variantId`  | `admin`                                              |

Customer identity, role, and workspace come from the verified token. Cart and order routes do not accept another customer ID from the request.

## Commands

Run the database commands from the repository root so the environment wrapper
loads `.env.local` and `.env`:

| Command            | Purpose                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- |
| `pnpm dev`         | Start the component through Portless at `https://commerce.multi-eve.localhost`     |
| `pnpm dev:app`     | Start raw Nitro development; used by Portless and the Vercel Services `devCommand` |
| `pnpm build`       | Create the production Nitro build                                                  |
| `pnpm start`       | Start the built Nitro server                                                       |
| `pnpm preview`     | Preview the Nitro production build                                                 |
| `pnpm lint`        | Run the package lint task                                                          |
| `pnpm check-types` | Run TypeScript                                                                     |
| `pnpm test`        | Run the commerce Vitest suite                                                      |
| `pnpm db:generate` | Generate a Drizzle migration                                                       |
| `pnpm db:migrate`  | Apply checked-in migrations                                                        |
| `pnpm db:seed`     | Restore deterministic demo data                                                    |

Root aliases are available for `db:generate`, `db:migrate`, and `db:seed`.
Package-level database commands require `DATABASE_URL` and
`DEMO_AUTH_SECRET` in the shell. Root `pnpm dev` starts this component with the
other named hosts through Turbo and the central `portless.json`.

The standalone HTTPS host is available only through the local loopback proxy for component debugging. It does not add a public `commerce` rewrite to Vercel deployments. Use root `pnpm dev:services` at [https://multi-eve.localhost](https://multi-eve.localhost) to test callers, generated bindings, and private service routing together.

Apply the checked-in migration before seeding. The seed restores fixed reference rows and must run only against a disposable demo database.

## Contract ownership

The canonical contract is [`packages/commerce-contract/openapi.yaml`](../../packages/commerce-contract/openapi.yaml). `GET /api/openapi.json` serves its generated JSON artifact. Do not edit generated OpenAPI files directly.

## Caveats

- Nitro is pinned to a beta release; verify Vercel routing after upgrades.
- Unit tests do not start Nitro or PostgreSQL.
- The reference has no checkout, payment, refund, or fulfillment operations.
- Private routing does not replace bearer-token authentication.
- Portless is pinned to the pre-1.0 release 0.15.5; review proxy and CA changes before upgrading it.

## Related documentation

- [OpenAPI connection](../../docs/openapi-connection.md)
- [Architecture](../../docs/architecture.md)
- [Security and caveats](../../docs/security-and-caveats.md)
- [Testing and evals](../../docs/testing-and-evals.md)
- [Portless](https://portless.sh)
