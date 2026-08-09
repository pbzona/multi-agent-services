# Extend the reference safely

Extend the repository by preserving its existing boundaries: direct user roles belong in root agents, internal business data stays behind private services, and every model-visible operation needs independent API authorization.

## Decide which boundary to add

| Need                                                     | Add                                                              |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| A directly addressed persona with its own auth and route | Eve root agent and Vercel service                                |
| A specialist invoked only by an existing agent           | Declared or remote subagent                                      |
| A separately built backend or frontend                   | Vercel service                                                   |
| A new commerce capability                                | Canonical OpenAPI operation and Nitro route                      |
| Real users, roles, and tenants                           | Production identity, authorization, and session ownership layers |

Read [Eve root agents](eve-root-agents.md) before representing a role as a subagent.

## Add an Eve root agent

Use this recipe when the browser or another external client must address the new agent directly.

### 1. Define the app boundary

Create `apps/<agent-name>/` with the same minimum structure as the existing roots:

```text
apps/<agent-name>/
├── agent/
│   ├── agent.ts
│   ├── instructions.md
│   ├── channels/eve.ts
│   ├── connections/commerce.ts
│   └── tools/
├── evals/
├── package.json
├── tsconfig.json
└── .vercelignore
```

Choose one role and task boundary. Write instructions that identify the authoritative data source, prohibited domains, ambiguity handling, approval behavior, and success criteria.

Separate the package's Portless entry point from its raw Eve server, following the existing roots:

```json
{
  "scripts": {
    "dev": "cross-env PORTLESS_PORT=443 portless",
    "dev:app": "node ../../scripts/run-with-env.mjs eve dev"
  }
}
```

`pnpm dev` uses the Portless wrapper for component work. Vercel Services and
the central Portless configuration call `dev:app` so they can assign the
listener without starting another proxy. The environment wrapper loads the
root OIDC token for local model commands.

### 2. Define route authentication

Author a custom `AuthFn<Request>` in `agent/channels/eve.ts`. Verify a trusted application session, require the new role or permission, and return a stable `principalId`, `principalType: "user"`, `issuer`, and bounded attributes such as `workspaceId`.

Do not copy the open demo persona endpoint into a production role. Route auth decides who reaches model execution, while later connection auth and API auth remain separate checks.

### 3. Minimize capabilities

Expose only the connections and tools the role needs. Follow the existing pattern and disable unused built-in shell, file, web, question, and delegation tools. Agents can ask for missing details in a normal response; disabling `ask_question` avoids a second approval-like prompt before a write's framework approval.

If the agent should not delegate, author `agent/tools/agent.ts` with `disableTool()` and state the no-delegation rule in `instructions.md`. If delegation is required, define the child boundary and approvals explicitly instead of leaving the default surface open by accident.

### 4. Add the commerce policy

Create a role-specific `operations.allow` list. Divide operations into explicit read and write sets, then return:

- `not-applicable` for reviewed reads.
- `user-approval` for side-effecting writes.
- A denied status for every unknown operation.

The connection auth resolver must verify the current session's authenticator, principal type, role, workspace, and principal ID before minting downstream credentials.

### 5. Register the Vercel service and local host

Add a service entry under `vercel.json#services` with a unique service name, app root, `framework: "eve"`, and caller-side binding to `commerce`. Set `EVE_PUBLIC_ROUTE_PREFIX` in its build command and set `devCommand` to `pnpm run dev:app`.

The raw `dev:app` command is intentional. `pnpm dev:services` already wraps the single public Vercel CLI endpoint with Portless, so a service-level Portless command would nest the proxy.

Add two routing pieces:

1. A service-local route transform from the public named prefix to `/eve/v1/*`.
2. A top-level rewrite to the new service before the catch-all `web` rewrite.

Add the package to `portless.json#apps` for standalone component development:

```json
{
  "apps/<agent-name>": {
    "name": "<agent-name>.multi-eve",
    "script": "dev:app"
  }
}
```

Component mode does not inject Vercel binding environment variables. The standalone agent host can exercise Eve discovery and non-commerce behavior, but it cannot call commerce until it runs inside `pnpm dev:services`.

Add `.gitignore` and `.vercelignore` entries for `.env*`, `.eve`, `.output`,
`.next`, and other generated files before running the new agent.

For an agent named `fulfillment`, use one consistent set of identifiers:

```text
Vercel service: eve-fulfillment
Browser agent: fulfillment
Public prefix: /eve/agents/fulfillment
Public API: /eve/agents/fulfillment/eve/v1/*
Internal API: /eve/v1/*
Component URL: https://fulfillment.multi-eve.localhost
```

### 6. Add a client and tests

Call the root with `useEveAgent({ agent: "fulfillment" })` only on surfaces that satisfy its route auth. Add deterministic auth tests, wrong-role route tests, operation-policy tests, approval protocol tests, and at least one live-model scope eval.

Run:

```bash
pnpm lint
pnpm check-types
pnpm test
pnpm --filter fulfillment-agent eval:strict
pnpm portless:proxy
pnpm dev:services
```

Verify the public prefix and commerce binding in a preview deployment.

## Add a Vercel service

Use this recipe for a backend or frontend that needs an independent build and runtime boundary.

### 1. Assign ownership

Define the service's data, routes, secrets, and callers before creating it. Avoid two services writing the same tables or owning the same side effect without a transaction and concurrency design.

### 2. Create one workspace app

Add the service under `apps/<service-name>` so the existing `apps/*` pnpm workspace pattern includes it. Put the framework's raw development command in `dev:app`, and make `dev` invoke the pinned Portless wrapper. Define the remaining scripts Turbo needs, such as `build`, `lint`, `check-types`, and `test`.

### 3. Register it in `vercel.json`

Add a unique key under `services` with its `root`, framework or runtime, and `devCommand: "pnpm run dev:app"`. Service names are deployment identifiers and binding targets, so treat renames as interface changes. Using the raw script prevents nested Portless when `pnpm dev:services` wraps the public Vercel CLI endpoint.

Add the app path, named host, and `script: "dev:app"` to the central `portless.json`. This makes `pnpm dev` expose the component through a stable `https://<name>.localhost` URL while retaining Turbo orchestration.

### 4. Add caller-side bindings

Every service that calls the new private service must declare its own binding:

```json
{
  "type": "service",
  "service": "pricing",
  "format": "url",
  "env": "PRICING_URL"
}
```

The generated variable is runtime-only. Do not add `PRICING_URL` to `.env.example` or set a fixed deployment hostname.

### 5. Expose only intentional ingress

A service remains private until a top-level rewrite targets it. Add a public rewrite only when an external client must reach the service, and place specific rewrites before `/(.*)`.

Bindings grant reachability but not authentication. Require application credentials, validate all inputs, authorize resources, and return bounded responses even for private services.

## Add a commerce operation

Use this recipe for every catalog, cart, order, product, or inventory API change.

### 1. Change the canonical contract

Edit `packages/commerce-contract/openapi.yaml`. Add one unique, stable `operationId`; bounded parameter and body schemas; bounded success and error responses; and the required bearer security declaration.

Use absolute-set semantics for quantities and mutable values where possible. For concurrent writes, include an observed version or idempotency key in the contract.

### 2. Regenerate artifacts

```bash
pnpm openapi:generate
pnpm openapi:check
```

Review both generated files, but never edit them directly.

### 3. Implement the Nitro route

Place the handler under `apps/commerce/server/routes/api`, not a top-level Nitro `api` directory. Match Nitro's filename conventions so the path and method align with the OpenAPI entry.

The handler must:

- Call `authorizeRequest` with the smallest role set.
- Derive workspace and customer identity only from the verified principal.
- Validate route, query, and bounded JSON body inputs.
- Delegate database logic to the relevant `server/services/` module.
- Return sanitized contract errors and explicit conflicts.

### 4. Update agent exposure deliberately

Do not add every new operation to both agents. Add the `operationId` only to the roots that require it, then classify it in each connection's read or write set.

For sensitive reads, approval may still be appropriate. For writes, require approval plus API authorization. For financial or irreversible actions, add idempotency, audit, and domain-specific safeguards beyond Eve approval.

### 5. Test all layers

Add contract assertions, validator tests, role and resource authorization tests, database integration tests, and evals only where model choice matters.

Run:

```bash
pnpm openapi:check
pnpm test
pnpm lint
pnpm check-types
```

Then exercise the operation through `pnpm dev:services` and a preview deployment.

Do not use a standalone agent host as the binding test. Standalone hosts do not receive `COMMERCE_URL`, while the integrated Services flow does.

Checkout and payment need a separately reviewed transactional and compliance design. Adding an OpenAPI operation alone is not sufficient.

## Replace demo auth with production auth

Production auth is a cross-service design, not a change to one cookie helper.

### 1. Establish the identity source

Choose an identity provider or existing application session that verifies users and returns stable subjects. Store role and workspace membership in an authoritative system, not in client-supplied request bodies.

Remove `DEMO_PERSONAS`, the automatic customer fallback in `proxy.ts`, and the unauthenticated `POST /api/persona` role switch.

### 2. Authenticate web requests

Verify the production session server-side in Next.js. Keep secure, HTTP-only cookie settings where cookies are used, and add origin and cross-site request forgery protections for state-changing browser requests.

Do not let missing or invalid sessions silently become a privileged or shared persona.

### 3. Authenticate each Eve root

Replace the demo `AuthFn` with a verifier for the same production session or access token. Return a stable user principal, issuer, role or permission claims, and workspace identity.

Keep each root's role check at the channel boundary. Add explicit per-session ownership and tenant ACL checks for create, continue, stream, cancel, clear, compact, and reset behavior because Eve route auth does not provide ownership automatically.

### 4. Secure service-to-service calls

Replace the shared demo-token design with a managed signing or token-exchange model. Prefer asymmetric verification or a dedicated internal identity system when multiple issuers or key rotation are required.

Commerce should verify issuer, audience, expiry, subject, role, workspace, and any service identity needed by policy. A Vercel service binding remains only the network reachability grant.

### 5. Add authorization and lifecycle controls

Enforce role and resource policy in commerce regardless of the model-visible allowlist. Add key rotation, revocation, audit events, rate limits, retention, and incident response.

Test wrong-role, cross-user, cross-workspace, expired, replayed, forged, and revoked credentials. Include a preview test that proves private bindings still require valid application auth.

## Related documentation

- [Architecture](architecture.md)
- [Eve root agents](eve-root-agents.md)
- [OpenAPI connection](openapi-connection.md)
- [Security and caveats](security-and-caveats.md)
- [Portless](https://portless.sh)
- [Vercel service configuration](https://vercel.com/docs/services/config-reference)
