# Troubleshoot the local and deployed topology

Start with the command mode, active persona, and failing service. Most integration failures come from running component mode when the request needs Vercel routing or a generated binding.

## First checks

Run these commands from the repository root:

```bash
node --version
pnpm --version
pnpm exec portless --version
vercel --version
pnpm portless:doctor
pnpm openapi:check
```

Expected toolchain versions are Node.js 24.x, pnpm 10.26.1, and Portless 0.15.5. The Vercel CLI must support the current `services` configuration and `vercel dev -L`; version 56.4.0 was used during documentation verification.

Then identify the intended mode:

| Command                 | Expected behavior                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `pnpm dev:services`     | Default integrated flow at `https://multi-eve.localhost`, with rewrites and generated bindings            |
| `pnpm dev`              | Four independent Portless component hosts, without generated bindings or named-agent public rewrites      |
| `pnpm dev:services:raw` | Integrated Vercel Services through the raw HTTP endpoint, without browser-facing Portless HTTPS or HTTP/2 |

Do not run `pnpm dev` and `pnpm dev:services` concurrently. Both register `multi-eve.localhost`; stop the current app command before switching modes.

## Portless proxy or HTTPS does not start

**Cause:** The shared proxy cannot bind port 443, its process state is stale, hostname resolution failed, or the local Portless CA is not trusted.

Run the read-only diagnostics first:

```bash
pnpm portless:doctor
```

Start the proxy explicitly if it is not running:

```bash
pnpm portless:proxy
```

The first start may prompt for `sudo` access and CA trust. If diagnostics report a stale shared proxy, stop and restart it:

```bash
pnpm portless:stop
pnpm portless:proxy
pnpm portless:doctor
```

`pnpm portless:stop` stops the shared proxy, so it also interrupts Portless hosts from other local projects that use the same proxy.

## Isolate Portless from Vercel Services

Run the raw fallback when `pnpm dev:services` fails before the browser reaches Vercel CLI:

```bash
pnpm dev:services:raw
```

Open the raw HTTP URL printed by Vercel CLI. The wrapper still runs `vercel dev -L`, so rewrites and generated service bindings remain active. If the raw flow works, diagnose Portless proxy, hostname, or CA state. Return to `pnpm dev:services` after fixing it because Portless HTTPS and HTTP/2 are the default browser-facing flow.

## `COMMERCE_URL is not configured`

**Cause:** `web` started in standalone `pnpm dev` component mode, or its caller-side Vercel Services binding did not resolve. Standalone hosts do not receive binding environment variables.

**Fix:** Stop the independent server and run this from the repository root:

```bash
pnpm dev:services
```

Do not add `COMMERCE_URL` to `.env`. Vercel Services generates it. If `pnpm dev:services` still fails, confirm that `vercel.json` contains the `web`, `eve-customer`, and `eve-admin` bindings to the `commerce` service.

## Catalog, cart, orders, or inventory shows a service error

**Cause:** Commerce cannot start, cannot reach PostgreSQL, rejected the caller, or received a request outside its contract.

Check in this order:

1. Confirm `DATABASE_URL` is exported in the shell that started Vercel CLI.
2. Run `pnpm db:migrate` against the intended database.
3. Run `pnpm db:seed` only if the target is a disposable demo database.
4. Inspect the `commerce` service log and preserve its sanitized `requestId`.
5. Confirm every service uses the same `DEMO_AUTH_SECRET` value for that environment.

`GET /api/health` is an internal commerce route. It returns `503` with `status: "degraded"` when its `select 1` database probe fails, but it is not publicly routed in this project.

## Database scripts cannot find `DATABASE_URL`

**Cause:** The root `.env` file is missing, `DATABASE_URL` is blank, or the package command was invoked directly instead of through the root environment loader.

Create `.env` from `.env.example`, set `DATABASE_URL`, then run the root command:

```bash
pnpm db:migrate
```

The root database aliases load `.env` through `scripts/run-with-env.mjs`. If you intentionally invoke an app-level database command directly, export the required variables into that shell first.

Do not print the connection string while debugging. Confirm only whether the variable is present and whether the target host is reachable.

## `pnpm db:seed` changes data you were testing

**Cause:** The seed is intentionally restorative. It upserts fixed reference rows, replaces seeded cart items, and replaces seeded order items.

Use a disposable database for the demo. Do not run the seed against records you need to preserve. A successful seed reports 12 products, 26 variants, and 4 orders.

## The agent panel reports `Agent connection failed`

Check these causes:

| Symptom                     | Likely cause                                                                                | Resolution                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Agent path returns `404`    | Ran `pnpm dev`, used the wrong public prefix, or the catch-all rewrite captured the request | Run `pnpm dev:services`; use `/eve/agents/customer/eve/v1/*` or `/eve/agents/admin/eve/v1/*` |
| Customer path returns `403` | Active cookie has role `admin`                                                              | Switch to `customer`, then start a new chat                                                  |
| Admin path returns `403`    | Active cookie has role `customer`                                                           | Switch to `admin`, then start a new chat                                                     |
| Request returns `401`       | Missing, invalid, expired, or differently signed demo cookie                                | Load a normal web page so the proxy can replace the demo session, then retry                 |
| Model call fails            | Vercel OIDC is missing or rejected                                                          | Link the repository root, run `pnpm exec vercel env pull`, and remove `AI_GATEWAY_API_KEY`   |

The web proxy intentionally excludes `/eve/` paths. It creates or repairs the demo cookie on normal storefront requests, not inside the Eve service.

## Eve starts locally but commerce tools fail

**Cause:** Running `pnpm --filter customer-agent dev` or `pnpm --filter admin-agent dev` authenticates the terminal client through `localDev()`. The commerce connection requires a verified `demo-session` user principal, so a synthetic local-dev principal cannot mint a commerce token.

Use the browser through [https://multi-eve.localhost](https://multi-eve.localhost) with `pnpm dev:services` for integrated commerce prompts. The standalone hosts at [https://customer.multi-eve.localhost](https://customer.multi-eve.localhost) and [https://admin.multi-eve.localhost](https://admin.multi-eve.localhost) receive no Vercel binding variables. They remain useful for discovery, instructions, and evals that do not call commerce.

Inspect each agent's discovered surface with:

```bash
pnpm --filter customer-agent exec eve info --json
pnpm --filter admin-agent exec eve info --json
```

Both should report Eve 0.29.5, `status: "ready"`, zero diagnostics, and no subagents.

## A commerce operation is missing from the agent

**Cause:** The operation has no stable `operationId`, generated artifacts are stale, or the role-specific allowlist omits it.

Run:

```bash
pnpm openapi:generate
pnpm openapi:check
pnpm --filter @repo/commerce-contract test
```

Then inspect `operations.allow` in the relevant `agent/connections/commerce.ts`. Add the operation only to the required role and classify it in the connection's read or write approval set.

## OpenAPI reports that the base URL must use HTTPS

**Cause:** `COMMERCE_URL` resolved to non-loopback HTTP. Eve 0.29.5 permits HTTP only for loopback hosts.

Portless's trusted HTTPS browser URL is separate from the internal binding URL. For local Services development, confirm the generated `COMMERCE_URL` parses to a loopback hostname; loopback HTTP is accepted. For preview or production, inspect only the URL protocol and require `https:`. Do not log the full binding URL.

The preview test on August 8, 2026 reached `commerce` through the generated
binding. Validate the binding again after a Services or Eve upgrade. Do not log
the complete URL.

## A service tries to start Portless again

**Cause:** A `vercel.json` service `devCommand` calls the package's `dev` script instead of its raw `dev:app` script. The outer `pnpm dev:services` process already owns the Portless route.

Set every service `devCommand` to `pnpm run dev:app`. Keep package `dev` scripts for standalone component mode and central `portless.json` orchestration.

## A write remains on `Approval needed`

**Cause:** Eve parked the durable turn and is waiting for an input response. A conversational confirmation is not the same as the structured approval response.

Select **Approve** or **Deny** in the rendered tool card. Keep the same chat session open so `inputResponses` can resume the parked turn. If the UI does not render options, inspect the Eve stream for `input.requested` and fix the client protocol before retrying the write.

No write should reach commerce while approval is pending, denied, or abandoned.

## Inventory update returns `VERSION_MISMATCH`

**Cause:** `expectedVersion` no longer matches the inventory row. Another successful write incremented the version after the agent read it.

Ask the admin agent to read the current inventory record again, review the new quantity and version, and submit a new exact update for approval. Do not retry with the stale version or convert the absolute quantity into an adjustment.

## Cart update returns `OUT_OF_STOCK` or `CONFLICT`

**Cause:** The requested final cart quantity exceeds current availability, or state changed between read and write.

Re-read the product or cart, report the current availability, and ask for a valid final quantity. A quantity of `0` removes the cart line. Checkout and payment are not available.

## A direct commerce URL returns `404` from the deployment

**Cause:** This is expected. The `commerce` service has no top-level public rewrite.

Call commerce only from server-side code in a service that declares a binding. Do not expose commerce publicly to make debugging easier; use service logs, a bound diagnostic path, or local topology tests instead.

## A new Nitro route works locally but not on Vercel

**Cause:** The handler may be in Nitro's shorthand `/api` directory instead of the standalone Vercel-compatible route tree.

Place commerce handlers under:

```text
apps/commerce/server/routes/api/
```

Match the method suffix and dynamic segment conventions already in use, such as `[productId].patch.ts` and `[variantId].put.ts`.

## Approval rendering fails after an Eve upgrade

**Cause:** The Eve UI projection or input-request types changed, while `apps/web/app/_components/agent-message.tsx` still targets Eve 0.29.5.

Read the installed Eve frontend and human-in-the-loop documentation, then align the renderer with the installed `EveMessageInputRequest` and `EveDynamicToolPart` types. Do not hide the mismatch with an unchecked cast. Run:

```bash
pnpm format:check
pnpm check-types
pnpm build
```

See [Testing and evals](testing-and-evals.md#current-verification-status) for the verified command state.

## Live evals fail before assertions

**Cause:** Eve could not start the model call, the 60-second timeout elapsed, or the target route rejected the eval client.

First list discovery without calling a model:

```bash
pnpm --filter customer-agent eval:list
pnpm --filter admin-agent eval:list
```

Then confirm AI Gateway credentials and run one package with verbose output:

```bash
pnpm --filter customer-agent exec eve eval --strict --verbose
```

Read the generated artifacts under `apps/customer-agent/.eve/evals/<timestamp>/` for the event stream and assertions. Do not paste credentials or full environment dumps into an issue.

## Related documentation

- [Getting started](getting-started.md)
- [Architecture](architecture.md)
- [OpenAPI connection](openapi-connection.md)
- [Security and caveats](security-and-caveats.md)
- [Portless](https://portless.sh)
