# Field & Form storefront

`apps/web` owns the Next.js 16 storefront, demo persona cookie, server-rendered commerce views, cart Server Actions, and browser clients for the two Eve root agents.

The app does not access PostgreSQL. Server-only code calls the private `commerce` service with the generated `COMMERCE_URL` binding and short-lived commerce JWTs.

## Service ownership

| Identifier        | Value                           |
| ----------------- | ------------------------------- |
| Workspace package | `web`                           |
| Vercel service    | `web`                           |
| Framework         | Next.js 16.3.0                  |
| Public rewrite    | `/(.*)` after both Eve rewrites |
| Outbound binding  | `COMMERCE_URL` to `commerce`    |

The named agent paths are owned by `eve-customer` and `eve-admin`, not Next.js. `useEveAgent({ agent: "customer" })` and `useEveAgent({ agent: "admin" })` call those same-origin public routes through Vercel's top-level routing.

## Routes

| Route                      | Ownership                                       |
| -------------------------- | ----------------------------------------------- |
| `/`                        | Product catalog                                 |
| `/products/[slug]`         | Product details and add-to-cart form            |
| `/cart`                    | Customer cart and quantity actions              |
| `/account/orders`          | Current customer's order list                   |
| `/account/orders/[number]` | Current customer's order detail                 |
| `/admin`                   | Role-gated inventory view and admin agent panel |
| `POST /api/persona`        | Demo-only customer or admin cookie switch       |

`proxy.ts` creates a customer demo session for normal web routes when no valid cookie exists. It excludes `/eve/`, so each Eve service authenticates its own requests.

## Commands

Run package commands from `apps/web`:

| Command            | Purpose                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `pnpm dev`         | Start the component through Portless at `https://multi-eve.localhost`    |
| `pnpm dev:app`     | Start raw Next.js; used by Portless and the Vercel Services `devCommand` |
| `pnpm lint`        | Run the package lint task                                                |
| `pnpm check-types` | Generate Next.js route types and run TypeScript                          |
| `pnpm build`       | Create the production Next.js build                                      |
| `pnpm start`       | Start the production build                                               |

From the repository root, use `pnpm --filter web <command>` for one package. Root `pnpm dev` starts every component host through Turbo and the central `portless.json`.

Use root `pnpm dev:services` for integrated development at [https://multi-eve.localhost](https://multi-eve.localhost). The standalone web host does not receive `COMMERCE_URL` and does not include the named Eve route table. `dev:app` remains raw so the outer Portless process can pass its `PORT` and `HOST` to Vercel CLI without nesting another proxy.

## Caveats

- `POST /api/persona` grants either fixed demo role without identity proof.
- The app uses a shared HMAC demo secret and is not a production auth system.
- Checkout and payment are intentionally unavailable.
- Component mode does not test Vercel service rewrites or binding generation.

## Related documentation

- [Getting started](../../docs/getting-started.md)
- [Architecture](../../docs/architecture.md)
- [Security and caveats](../../docs/security-and-caveats.md)
- [Troubleshooting](../../docs/troubleshooting.md)
- [Portless](https://portless.sh)
