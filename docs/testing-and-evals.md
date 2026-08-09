# Test the services and agents

The repository combines deterministic Vitest suites, static checks, OpenAPI
drift detection, two live-model Eve evals, and local and preview integration
checks. The deterministic test suite does not start PostgreSQL.

## Current verification status

The following checks ran during the release pass with Node.js 24.15.0 and pnpm
10.26.1. The working tree was not clean, so these results are not attached to
a commit.

| Command                    | Result | Verified behavior                                                        |
| -------------------------- | ------ | ------------------------------------------------------------------------ |
| `pnpm test`                | Passed | 20 Vitest tests across 7 files and 3 packages                            |
| `pnpm openapi:check`       | Passed | Generated JSON and declarations match `openapi.yaml`                     |
| `pnpm lint`                | Passed | All six configured package tasks completed                               |
| `pnpm check-types`         | Passed | All six configured TypeScript tasks completed                            |
| `pnpm format:check`        | Passed | All matched source and documentation files match Prettier                |
| `pnpm build`               | Passed | Next.js, Nitro, and both Eve roots produced production builds            |
| `eve info` in each agent   | Passed | Eve 0.29.5 reported ready, zero diagnostics, and zero subagents          |
| Preview model calls        | Passed | Both roots completed an OIDC-authenticated Gateway request               |
| `pnpm ai:costs`            | Passed | Custom Reporting returned one tagged row for each root                   |
| Preview migration and seed | Passed | Applied the schema and loaded 12 products, 26 variants, and 4 orders     |
| Preview commerce routes    | Passed | Catalog, cart, inventory, private routing, and both agent reads worked   |
| Preview write approvals    | Passed | Customer cart and admin inventory writes required approval and succeeded |

These checks remain outstanding:

- `pnpm eval` and `eval:strict`, because they make live model calls.
- A database-backed local integration run.
- Browser verification through `pnpm dev:services`.

## Run deterministic checks

Run the full deterministic set from the repository root:

```bash
pnpm openapi:check
pnpm test
pnpm lint
pnpm check-types
pnpm format:check
```

Use `pnpm build` as the final static and bundling gate after the commands above pass:

```bash
pnpm build
```

Do not ignore a failing package because another Turbo task passed. The root command succeeds only when every configured task succeeds.

## Understand the Vitest coverage

`pnpm test` currently executes packages that define a `test` script. The web and agent packages do not define deterministic test scripts.

### Commerce service

Five files contain 13 tests:

| File                                    | Coverage                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `apps/commerce/test/auth.test.ts`       | Bearer parsing, commerce JWT verification, and role rejection                                |
| `apps/commerce/test/cursor.test.ts`     | Cursor round trips, malformed cursor rejection, and resource-kind isolation                  |
| `apps/commerce/test/errors.test.ts`     | Contract error preservation and unhandled-message sanitization                               |
| `apps/commerce/test/seed-data.test.ts`  | Deterministic products, variants, inventory states, cart rows, and order arithmetic          |
| `apps/commerce/test/validation.test.ts` | Query bounds, absolute quantities, optimistic concurrency input, identifiers, and image URLs |

These are unit tests. They do not start Nitro, open PostgreSQL, apply a migration, or issue an HTTP request to a route.

### Demo auth package

`packages/demo-auth/test/auth.test.ts` contains three tests. They cover customer session round trips, cookie request authentication, and commerce actor round trips with an isolated test secret.

The tests do not cover expiry, issuer or audience rejection, cookie attributes, persona endpoint authorization, key rotation, or cross-user session ownership.

### Commerce contract package

`packages/commerce-contract/test/openapi.test.ts` contains three tests. They assert unique expected `operationId` values, the exact method and path set, and a non-mutating server override.

`pnpm openapi:check` adds a separate byte-for-byte generated-artifact drift check. Neither check proves that every Nitro implementation matches its response schema at runtime.

## Run Eve evals

Each root contains one live-model `role-scope` eval:

| Agent            | Prompted behavior                      | Assertions                                                |
| ---------------- | -------------------------------------- | --------------------------------------------------------- |
| `customer-agent` | Decline store inventory administration | Run succeeds, uses no tools, and reply includes a decline |
| `admin-agent`    | Decline customer cart or order access  | Run succeeds, uses no tools, and reply includes a decline |

List evals without model calls:

```bash
pnpm --filter customer-agent eval:list
pnpm --filter admin-agent eval:list
```

Run both configured suites through Turbo:

```bash
pnpm eval
```

Run strict package gates for continuous integration:

```bash
pnpm --filter customer-agent eval:strict
pnpm --filter admin-agent eval:strict
```

Both eval configs use `maxConcurrency: 1` and `timeoutMs: 60000`. Eve writes run artifacts under each app's `.eve/evals/<timestamp>/` directory. Live evals require valid AI Gateway credentials and can vary with model behavior.

## Report AI Gateway costs

The root script queries Custom Reporting by the two agent tags:

```bash
pnpm ai:costs
pnpm ai:costs -- 2026-08-01 2026-08-08
```

The command uses Vercel OIDC. It reports requests, token counts, and charged
cost for each root. Reporting data can take several minutes to appear, and the
report query may incur a charge. The report endpoint is not available on every
Vercel plan.

## Understand current eval gaps

The two role-decline evals are model scope checks, not authorization tests. They
explicitly tell the model not to inspect store data and assert `usedNoTools()`.

Current evals do not verify:

- Exact OpenAPI tool discovery or operation allowlists.
- Customer and admin read results against seeded commerce data.
- Approval parking, denial, resumption, or exact write inputs.
- Rejection of a forged, wrong-role, expired, or cross-workspace session.
- Behavior after `409 VERSION_MISMATCH`, out-of-stock responses, or service failures.

Add deterministic route and integration tests for security properties. Use model evals for behavior that genuinely depends on model decisions.

## Run local integration checks

After configuring a disposable PostgreSQL database:

```bash
pnpm db:migrate
pnpm db:seed
pnpm portless:proxy
pnpm portless:doctor
pnpm dev:services
```

Portless 0.15.5 may prompt for `sudo` access and local CA trust when the shared HTTPS proxy first binds port 443. Validate these flows through [https://multi-eve.localhost](https://multi-eve.localhost):

| Flow                               | Expected result                                                       |
| ---------------------------------- | --------------------------------------------------------------------- |
| Open `/`                           | Catalog contains 12 seeded products                                   |
| Open `/cart` as customer           | Avery's seeded cart contains 4 units across 3 lines                   |
| Open `/account/orders` as customer | Four seeded orders are visible                                        |
| Open `/admin` as customer          | Role gate appears; no inventory request runs                          |
| Switch to admin and open `/admin`  | Inventory table and admin agent render                                |
| Send a customer cart write         | Eve displays approval before commerce receives the write              |
| Send an admin inventory write      | Eve reads the version, displays approval, and refreshes after success |

These checks use the integrated flow. `pnpm dev` starts four independent
component hosts through Turbo and `portless.json`; it does not provide Vercel
rewrites or binding variables. Standalone customer and admin hosts therefore
cannot exercise commerce tools.

If the integrated flow fails before any service request reaches Vercel CLI, run
`pnpm portless:doctor`. Use `pnpm dev:services:raw` to retry through Vercel
CLI's raw HTTP endpoint. A successful raw run isolates the failure to Portless,
hostname, or CA state. It does not replace the HTTPS flow as the default test
path.

Reseed when you need to restore the deterministic cart, orders, and inventory:

```bash
pnpm db:seed
```

The seed overwrites reference rows. Use only a disposable demo database.

## Test the deployed topology

A preview deployment is the only place to validate the deployed service-binding
transport and public route table. Follow these checks:

1. Confirm the customer and admin Eve health paths resolve to different services.
2. Confirm catalog requests prove `web` can call private `commerce`.
3. Confirm the wrong persona receives `403` from each agent prefix.
4. Confirm no public rewrite reaches commerce directly.
5. Confirm the injected commerce URL protocol is HTTPS without logging the full value.

The preview route and binding checks above passed. Browser-facing Portless
HTTPS and local `vercel dev -L` cannot prove deployment protection behavior or
platform environment scoping.

## Recommended missing test layers

### Deterministic integration tests

- Start Nitro against an isolated PostgreSQL database and exercise every route.
- Assert role, workspace, and customer ownership at the HTTP boundary.
- Assert migrations and repeated seeds from an empty database.
- Assert OpenAPI response examples or schemas against actual route responses.
- Assert error headers, request IDs, body limits, and sanitized failures.

### Browser and agent protocol tests

- Test persona switching, role gates, cart Server Actions, and UI refreshes.
- Test Eve create, continue, stream, cancel, clear, compact, and reset ownership rules.
- Test approval rendering and exact `inputResponses` for all three writes.
- Test service failure, reconnect, denial, and stale-version recovery.
- Test that checkout and payment remain unavailable.

## Related documentation

- [Getting started](getting-started.md)
- [Deployment](deployment.md)
- [OpenAPI connection](openapi-connection.md)
- [Portless](https://portless.sh)
- [Eve evals](https://eve.dev/docs/evals/running)
