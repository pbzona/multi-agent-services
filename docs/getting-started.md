# Get started locally

Run the Field & Form storefront, both Eve root agents, and the private commerce API through the same topology used by Vercel Services.

> [!WARNING]
> Local setup creates fixed customer and admin demo personas. Do not use the demo identity system with real users or real commerce data.

## Prerequisites

| Requirement       | Repository expectation                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Node.js           | 24.x                                                                                     |
| pnpm              | 10.26.1                                                                                  |
| Portless          | Pinned workspace dependency at 0.15.5                                                    |
| PostgreSQL        | A reachable disposable database with permission to create and update the commerce schema |
| Vercel CLI        | The pinned workspace version with `services` and `vercel dev -L` support                 |
| AI Gateway access | A repository linked to a Vercel project with OIDC enabled                                |

Confirm the local toolchain:

```bash
node --version
pnpm --version
pnpm exec portless --version
vercel --version
```

The Node.js output must start with `v24.`, the pnpm output must be `10.26.1`, and the Portless output must be `0.15.5`.

## Install dependencies

From the repository root, install the locked workspace:

```bash
pnpm install
```

The repository uses a pnpm lockfile and workspace packages. Do not install each app independently.

[Portless](https://portless.sh) is pinned because it is pre-1.0. An upgrade can change proxy behavior, local state, or CA trust requirements. Review its changelog and rerun `pnpm portless:doctor` after changing the version.

## Configure the environment

Create a local file from the blank root template:

```bash
cp .env.example .env
```

Set these values locally:

| Variable           | Required | Consumer                             | Purpose                                     |
| ------------------ | -------- | ------------------------------------ | ------------------------------------------- |
| `DATABASE_URL`     | Yes      | `commerce` and root database scripts | PostgreSQL connection string                |
| `DEMO_AUTH_SECRET` | Yes      | All four services                    | Signs demo session and commerce access JWTs |

`COMMERCE_URL` is absent from the template by design. Vercel Services generates it from each caller's binding to `commerce`. A user-set value can bypass deployment-aware routing or point an agent at the wrong environment.

Root development, database, eval, and report scripts load `.env.local` and then
`.env`. Existing process environment variables take precedence. Create the
OIDC file from the linked project:

```bash
pnpm exec vercel link
pnpm exec vercel env pull
```

The local OIDC token is short-lived. Run `pnpm exec vercel env pull` again when
the token expires. Do not set `AI_GATEWAY_API_KEY`; the agents and the cost
report reject it.

Keep local environment files ignored and never print them while debugging.

## Prepare the database

Apply the checked-in Drizzle migration, then seed the deterministic reference data:

```bash
pnpm db:migrate
pnpm db:seed
```

The seed is repeatable. It restores one workspace, three users, 12 products, 26 variants, one active cart, and four orders. A successful run ends with:

```text
Seeded 12 products, 26 variants, and 4 orders.
```

`pnpm db:seed` resets the seeded cart items and order items to their checked-in state. Do not run it against data you need to preserve.

## Start the shared HTTPS proxy

Start the shared Portless proxy from the repository root:

```bash
pnpm portless:proxy
```

The proxy listens on port 443. Its first start may prompt for `sudo` access to bind the privileged port and permission to trust Portless's local certificate authority (CA). Portless then provides browser-facing HTTPS and HTTP/2 without browser certificate warnings.

Diagnose proxy liveness, route state, hostname resolution, and CA trust with:

```bash
pnpm portless:doctor
```

Stop the shared proxy when you no longer need local hosts:

```bash
pnpm portless:stop
```

## Start all four services

Run the topology-aware development command from the repository root:

```bash
pnpm dev:services
```

Open [https://multi-eve.localhost](https://multi-eve.localhost). This is the default integrated development flow.

`pnpm dev:services` wraps one public Vercel Services endpoint with Portless. Portless assigns `PORT` and `HOST`, then `scripts/vercel-dev.mjs` maps them into `vercel dev -L --listen`. Vercel CLI builds the service routing table, starts each service, and injects binding URLs. Each `vercel.json` service calls its raw `dev:app` script so the outer Portless process is not nested inside another Portless process.

The local topology exposes these public paths:

| Path                            | Destination    |
| ------------------------------- | -------------- |
| `/(.*)`                         | `web`          |
| `/eve/agents/customer/eve/v1/*` | `eve-customer` |
| `/eve/agents/admin/eve/v1/*`    | `eve-admin`    |

`commerce` has no public rewrite. Only `web`, `eve-customer`, and `eve-admin` can reach it through their `COMMERCE_URL` bindings.

Portless secures the browser-facing local endpoint. It does not replace or rewrite Vercel service bindings. Vercel CLI still injects deployment-aware runtime URLs, and a local `COMMERCE_URL` may use loopback HTTP that Eve accepts. A deployed `COMMERCE_URL` must still be verified as HTTPS in preview.

## Choose the correct development command

| Command                 | Use it for                                        | Behavior                                                                                  |
| ----------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm dev:services`     | Storefront, agent, auth, and commerce integration | Default flow with one Portless HTTPS origin, Vercel rewrites, and generated bindings      |
| `pnpm dev`              | Editing or debugging independent components       | Turbo starts four Portless hosts without Vercel rewrites or generated binding variables   |
| `pnpm dev:services:raw` | Isolating a Portless proxy or CA problem          | Keeps the Vercel Services topology but exposes Vercel CLI's raw HTTP development endpoint |
| `pnpm portless:proxy`   | Starting shared browser-facing ingress            | Starts the HTTPS proxy on port 443                                                        |
| `pnpm portless:doctor`  | Diagnosing the shared proxy                       | Reports proxy, route, hostname, and CA trust health                                       |
| `pnpm portless:stop`    | Ending the proxy lifecycle                        | Stops the shared proxy                                                                    |

The central `portless.json` defines the component hosts used by `pnpm dev`:

| Component        | Local URL                                                                    |
| ---------------- | ---------------------------------------------------------------------------- |
| `web`            | [https://multi-eve.localhost](https://multi-eve.localhost)                   |
| `customer-agent` | [https://customer.multi-eve.localhost](https://customer.multi-eve.localhost) |
| `admin-agent`    | [https://admin.multi-eve.localhost](https://admin.multi-eve.localhost)       |
| `commerce`       | [https://commerce.multi-eve.localhost](https://commerce.multi-eve.localhost) |

Standalone agent hosts do not receive Vercel binding environment variables, including `COMMERCE_URL`. They remain useful for Eve discovery, instructions, and evals that do not call commerce. Do not set `COMMERCE_URL` manually to make component mode resemble a deployment; use `pnpm dev:services` to test binding generation and routing.

## Walk through the customer experience

1. Open `/`. The Next.js proxy creates a `customer` demo session for Avery Morgan when no valid session cookie exists.
2. Browse `/products/horizon-standing-desk`, choose an available variant, and add it to the cart.
3. Open **Ask Form** and send `What is currently in my cart?`.
4. Send `Set the Grid Felt Desk Mat quantity to 2.` and approve the displayed `setCartItemQuantity` input.
5. Open `/cart` and `/account/orders` to confirm the customer-scoped views.

The agent may ask a focused question if a product or variant is ambiguous. An approval is the confirmation for the exact write input; no cart change occurs if you deny or abandon it.

## Walk through the admin experience

1. Select the `admin` persona. `POST /api/persona` returns JSON and replaces the cookie. The client then navigates to `/admin`.
2. Review the inventory table, then send `Summarize low-stock variants` to the Inventory agent.
3. Send `Set the Fold Laptop Stand / Black on-hand quantity to 4.`.
4. Approve the `setInventoryLevel` input after the agent reads the current `expectedVersion`.
5. Switch back to `customer` to return to the storefront.

The admin agent has no cart or order operations. The customer agent has no product-administration or inventory operations.

## Verify the setup

Run deterministic checks in another terminal:

```bash
pnpm test
pnpm openapi:check
pnpm lint
```

Run `pnpm portless:doctor`, then follow the local integration checks in
[Testing and evals](testing-and-evals.md). The current status of
`pnpm check-types` is also recorded there.

## Next steps

- Read [Architecture](architecture.md) to trace both request paths.
- Read [Security and caveats](security-and-caveats.md) before exposing a deployment.
- Read [Deployment](deployment.md) to configure one Vercel Services project.
