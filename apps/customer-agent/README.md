# Customer Eve root agent

`apps/customer-agent` owns the independently routed Eve root for catalog questions, the authenticated customer's current cart, and only that customer's orders.

The agent is not an admin subagent and has no `agent/subagents/` directory. Its built-in delegation, shell, file, and web tools are disabled.

## Service ownership

| Identifier          | Value                                 |
| ------------------- | ------------------------------------- |
| Workspace package   | `customer-agent`                      |
| Vercel service      | `eve-customer`                        |
| Browser agent name  | `customer`                            |
| Public prefix       | `/eve/agents/customer/eve/v1/*`       |
| Internal Eve prefix | `/eve/v1/*`                           |
| Required demo role  | `customer`                            |
| Outbound binding    | `COMMERCE_URL` to `commerce`          |
| Gateway report tag  | `multi-agent-services:customer-agent` |

The service build sets `EVE_PUBLIC_ROUTE_PREFIX=/eve/agents/customer` so Eve-generated callback URLs use the public named-agent path.

## Commerce operations

| Access                   | `operationId` values                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Read without approval    | `listProducts`, `getProduct`, `getCurrentCart`, `listCurrentCustomerOrders`, `getCurrentCustomerOrder` |
| Write with user approval | `setCartItemQuantity`                                                                                  |

Connection auth requires a verified `demo-session` user with role `customer`, then mints a five-minute commerce token for the same principal and workspace.

The model uses Vercel OIDC for AI Gateway access. The agent rejects
`AI_GATEWAY_API_KEY`.

## Eve routes

The public prefix exposes Eve health, info, create-session, follow-up, cancel, clear, compact, reset, and stream behavior. `vercel.json` transforms the public path to the internal `/eve/v1/*` route tree.

## Commands

Run package commands from `apps/customer-agent`:

| Command            | Purpose                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| `pnpm dev`         | Start Eve through Portless at `https://customer.multi-eve.localhost`             |
| `pnpm dev:app`     | Start raw Eve development; used by Portless and the Vercel Services `devCommand` |
| `pnpm build`       | Build the Eve root                                                               |
| `pnpm start`       | Start the built Eve root                                                         |
| `pnpm lint`        | Run the package lint task                                                        |
| `pnpm check-types` | Run TypeScript                                                                   |
| `pnpm eval:list`   | List evals without a model call                                                  |
| `pnpm eval`        | Run the configured live-model eval                                               |
| `pnpm eval:strict` | Run the eval as a strict package gate                                            |

Standalone `pnpm dev` opens Eve's development UI but does not receive Vercel binding environment variables, including `COMMERCE_URL`. A `localDev()` principal can inspect the agent but cannot call commerce because connection auth also requires the browser's verified demo session. Use root `pnpm dev:services` at [https://multi-eve.localhost](https://multi-eve.localhost) for the integrated customer demo.

The raw `dev:app` split prevents nested Portless processes. `portless.json` invokes it for component mode, and `vercel.json` invokes it after the outer integrated endpoint is already wrapped.

## Caveats

- The fixed customer persona is not production authentication.
- Eve route auth does not enforce per-user ownership of a referenced session.
- `COMMERCE_URL` is generated only by Services and must not be user-set; standalone hosts do not receive it.
- The single eval checks only that the model declines inventory administration without tools.

## Related documentation

- [Eve root agents](../../docs/eve-root-agents.md)
- [OpenAPI connection](../../docs/openapi-connection.md)
- [Security and caveats](../../docs/security-and-caveats.md)
- [Testing and evals](../../docs/testing-and-evals.md)
- [Portless](https://portless.sh)
