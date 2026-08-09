# Admin Eve root agent

`apps/admin-agent` owns the independently routed Eve root for product and inventory administration. It cannot access customer carts or orders.

The agent is not a customer subagent and has no `agent/subagents/` directory. Its built-in delegation, shell, file, and web tools are disabled.

## Service ownership

| Identifier          | Value                              |
| ------------------- | ---------------------------------- |
| Workspace package   | `admin-agent`                      |
| Vercel service      | `eve-admin`                        |
| Browser agent name  | `admin`                            |
| Public prefix       | `/eve/agents/admin/eve/v1/*`       |
| Internal Eve prefix | `/eve/v1/*`                        |
| Required demo role  | `admin`                            |
| Outbound binding    | `COMMERCE_URL` to `commerce`       |
| Gateway report tag  | `multi-agent-services:admin-agent` |

The service build sets `EVE_PUBLIC_ROUTE_PREFIX=/eve/agents/admin` so Eve-generated callback URLs use the public named-agent path.

## Commerce operations

| Access                   | `operationId` values                          |
| ------------------------ | --------------------------------------------- |
| Read without approval    | `listProducts`, `getProduct`, `listInventory` |
| Write with user approval | `updateProduct`, `setInventoryLevel`          |

Connection auth requires a verified `demo-session` user with role `admin`, then mints a five-minute commerce token for the same principal and workspace. `setInventoryLevel` also requires the current `expectedVersion`.

The model uses Vercel OIDC for AI Gateway access. The agent rejects
`AI_GATEWAY_API_KEY`.

## Eve routes

The public prefix exposes Eve health, info, create-session, follow-up, cancel, clear, compact, reset, and stream behavior. `vercel.json` transforms the public path to the internal `/eve/v1/*` route tree.

## Commands

Run package commands from `apps/admin-agent`:

| Command            | Purpose                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| `pnpm dev`         | Start Eve through Portless at `https://admin.multi-eve.localhost`                |
| `pnpm dev:app`     | Start raw Eve development; used by Portless and the Vercel Services `devCommand` |
| `pnpm build`       | Build the Eve root                                                               |
| `pnpm start`       | Start the built Eve root                                                         |
| `pnpm lint`        | Run the package lint task                                                        |
| `pnpm check-types` | Run TypeScript                                                                   |
| `pnpm eval:list`   | List evals without a model call                                                  |
| `pnpm eval`        | Run the configured live-model eval                                               |
| `pnpm eval:strict` | Run the eval as a strict package gate                                            |

Standalone `pnpm dev` opens Eve's development UI but does not receive Vercel binding environment variables, including `COMMERCE_URL`. A `localDev()` principal can inspect the agent but cannot call commerce because connection auth also requires the browser's verified demo session. Use root `pnpm dev:services` at [https://multi-eve.localhost](https://multi-eve.localhost) for the integrated admin demo.

The raw `dev:app` split prevents nested Portless processes. `portless.json` invokes it for component mode, and `vercel.json` invokes it after the outer integrated endpoint is already wrapped.

## Caveats

- The fixed admin persona is available to any visitor through the demo switcher.
- Eve route auth does not enforce per-user ownership of a referenced session.
- `COMMERCE_URL` is generated only by Services and must not be user-set; standalone hosts do not receive it.
- The single eval checks only that the model declines cart and order access without tools.

## Related documentation

- [Eve root agents](../../docs/eve-root-agents.md)
- [OpenAPI connection](../../docs/openapi-connection.md)
- [Security and caveats](../../docs/security-and-caveats.md)
- [Testing and evals](../../docs/testing-and-evals.md)
- [Portless](https://portless.sh)
