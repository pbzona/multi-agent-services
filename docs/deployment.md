# Deploy the four-service project

Deploy the repository root as one Vercel Services project so public routing,
private commerce bindings, and named Eve paths remain in one deployment.

> [!WARNING]
> A successful deployment does not make this template suitable for production.
> Complete the checklist in [Security and caveats](security-and-caveats.md)
> before using real identities or data.

## Deployment shape

`vercel.json` is the deployment source of truth:

| Service        | Framework | Build behavior                                                                              | Binding                      |
| -------------- | --------- | ------------------------------------------------------------------------------------------- | ---------------------------- |
| `web`          | `nextjs`  | Uses `apps/web`                                                                             | `COMMERCE_URL` to `commerce` |
| `eve-customer` | `eve`     | Runs `EVE_PUBLIC_ROUTE_PREFIX=/eve/agents/customer pnpm run build` in `apps/customer-agent` | `COMMERCE_URL` to `commerce` |
| `eve-admin`    | `eve`     | Runs `EVE_PUBLIC_ROUTE_PREFIX=/eve/agents/admin pnpm run build` in `apps/admin-agent`       | `COMMERCE_URL` to `commerce` |
| `commerce`     | `nitro`   | Uses `apps/commerce`                                                                        | None                         |

The deployment exposes `web` and both named Eve prefixes. It does not expose `commerce` through public routing.

Every service also sets `devCommand` to `pnpm run dev:app`. These raw framework scripts let `scripts/vercel-dev.mjs` map Portless's `PORT` and `HOST` into `vercel dev -L --listen` without starting Portless again inside each service. The `devCommand` split affects local development only; production builds use the build behavior above.

Do not run `eve deploy` from either agent directory for this topology. That command deploys an Eve app as its own project, while this repository requires both agents, Next.js, Nitro, and their bindings in one root Vercel deployment.

## Prerequisites

- A Vercel team with Services permission.
- The pinned Vercel CLI from the repository root.
- A managed PostgreSQL database reachable from the selected Vercel regions.
- Production and preview environment values for `DATABASE_URL` and `DEMO_AUTH_SECRET`.
- Vercel project OIDC access for AI Gateway.

The repository requires Node.js 24.x and pnpm 10.26.1. Keep the root
`packageManager` and `engines` fields effective during the build.

## Link the repository root

Authenticate Vercel CLI, then link from the repository root:

```bash
vercel link
```

Select or create one project for the complete Services deployment. Do not link each app as an independent project.

For non-interactive continuous integration, use a token or workload identity managed outside the repository and run:

```bash
vercel link --project your_project_name --yes --non-interactive
```

Do not commit `.vercel/`, access tokens, pulled environment files, or OIDC tokens.

## Configure environment variables

Configure these values in the Vercel project for the required environments:

| Variable             | Preview  | Production | Notes                                                                              |
| -------------------- | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Required | Required   | Use separate databases or isolated schemas. Nitro consumes this variable.          |
| `DEMO_AUTH_SECRET`   | Required | Required   | Use a distinct random value per environment and share it across the four services. |
| `AI_GATEWAY_API_KEY` | Never    | Never      | Do not configure this variable. The agents require Vercel OIDC.                    |

Do not configure `COMMERCE_URL`. The caller-side binding generates and injects
it at function runtime. Bindings do not resolve during builds and are not
available to Routing Middleware.

Do not configure `AI_GATEWAY_API_KEY`. Vercel OIDC authenticates model requests.
The source code fails when it finds an API key, which prevents an old key from
silently taking precedence.

Vercel Services use project environment configuration. The code reads `DATABASE_URL` only from Nitro, but verify the platform's current service-level secret-scoping options if other service processes must not receive the value.

## Prepare the database

Run migrations from a trusted release environment with the target `DATABASE_URL` exported:

```bash
pnpm db:migrate
```

Do not make application startup or every build race to run migrations. Coordinate schema rollout with backward-compatible application changes and a rollback plan.

`pnpm db:seed` restores fixed reference users, products, inventory, cart rows, and orders. Run it only for an isolated demo environment whose data may be overwritten. Never use the demo seed as a production data migration.

## Run pre-deployment checks

Run the deterministic checks from the repository root:

```bash
pnpm openapi:check
pnpm test
pnpm lint
pnpm format:check
pnpm check-types
pnpm build
```

Do not promote while any command fails. Run these commands for the exact commit
you intend to deploy. See [current verification status](testing-and-evals.md#current-verification-status).

Live-model evals are a separate gate:

```bash
pnpm --filter customer-agent eval:strict
pnpm --filter admin-agent eval:strict
```

These evals require model credentials and make external model calls. Current coverage checks role-decline responses only; it does not validate service bindings or commerce mutations.

## Create a preview deployment

Deploy from the repository root:

```bash
pnpm exec vercel deploy --yes
```

Vercel builds all four services and creates deployment-aware bindings. The
default command creates a preview deployment. Do not add `--prod` or
`--target=production`.
Preview requests from `web` or an Eve service reach `commerce` in the same
preview deployment.

Validate the preview before production:

1. Open the preview root and confirm the catalog loads from commerce.
2. Check `GET /eve/agents/customer/eve/v1/health` and `GET /eve/agents/admin/eve/v1/health`.
3. Exercise customer and admin read prompts with the correct persona.
4. Approve one isolated cart write and one isolated inventory write, then verify the UI refreshes.
5. Confirm that no public path routes directly to commerce.

The Eve health routes are public by framework design and do not test persona auth. A successful catalog request validates the web-to-commerce binding and bearer-token path more completely.

## Verify the service binding protocol

Eve 0.29.5 accepts HTTPS base URLs and loopback HTTP only. Vercel currently documents a binding as an absolute generated URL without specifying its protocol.

In preview, inspect only the parsed protocol inside the Eve runtime and confirm
`new URL(process.env.COMMERCE_URL).protocol === "https:"`. Do not print the
complete binding URL or any headers. Treat a non-loopback `http:` value as a
release blocker.

## Promote to production

After the preview and security gates pass, deploy production from the root:

```bash
vercel --prod
```

Repeat the public route, role, approval, and binding checks against the production URL. Use production-safe test records and avoid destructive inventory changes.

## Public route verification

| Request                                                              | Expected owner | Expected result     |
| -------------------------------------------------------------------- | -------------- | ------------------- |
| `GET /`                                                              | `web`          | Storefront response |
| `GET /eve/agents/customer/eve/v1/health`                             | `eve-customer` | Eve health response |
| `GET /eve/agents/admin/eve/v1/health`                                | `eve-admin`    | Eve health response |
| `POST /eve/agents/customer/eve/v1/session` with an admin demo cookie | `eve-customer` | `403`               |
| `POST /eve/agents/admin/eve/v1/session` with a customer demo cookie  | `eve-admin`    | `403`               |

The catch-all `web` rewrite must remain last. If it moves above either Eve rewrite, Next.js receives the agent paths instead.

## Observe and roll back

Use Vercel deployment logs and service-level function observability to separate failures in `web`, `eve-customer`, `eve-admin`, and `commerce`. Eve deployments may also expose Agent Runs in Vercel Observability when enabled for the team.

For a rollback:

- Roll back the complete Services deployment, not one service in isolation.
- Keep database migrations backward compatible with the previous deployment.
- Do not log demo cookies, commerce JWTs, environment values, or full binding URLs.
- Preserve sanitized commerce `requestId` values for incident correlation.

## Platform caveats

Vercel Services routes internal binding calls outside the public request pipeline. Firewall, Deployment Protection, and top-level middleware do not authorize commerce calls. Keep JWT verification in the private service.

Eve 0.29.5 and Nitro `3.0.260610-beta` are pre-release dependencies. Review installed package documentation and release notes before upgrades, then validate route generation, callbacks, approvals, OpenAPI URL checks, and durable session behavior in preview.

## Related documentation

- [Getting started](getting-started.md)
- [Architecture](architecture.md)
- [Security and caveats](security-and-caveats.md)
- [Vercel Services](https://vercel.com/docs/services)
- [Vercel Services routing](https://vercel.com/docs/services/routing)
