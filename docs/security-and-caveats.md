# Security boundaries and caveats

The template demonstrates layered authorization and least-privilege agent
tools. Its identity and operational controls are limited to the demo scenario.

> [!CAUTION]
> Do not expose this template to real customers, administrators, payment data,
> regulated data, or production commerce systems without replacing the demo
> identity layer and closing the limitations below.

## Implemented controls

| Layer            | Current control                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Public routing   | `commerce` has no public top-level rewrite                                                                                                      |
| Eve route auth   | The demo cookie authenticator checks the root's `customer` or `admin` role. Vercel OIDC and local development auth are also enabled.            |
| Agent capability | Role-specific OpenAPI allowlists; shell, file, web, question, and delegation tools are disabled                                                 |
| Human approval   | Every write exposed to an Eve agent returns `user-approval` before execution. Storefront cart forms write directly after session authorization. |
| Commerce auth    | Five-minute bearer JWTs carry a verified principal ID, role, workspace, issuer, and audience                                                    |
| Data scope       | Commerce derives workspace and customer scope from the verified token, never request parameters                                                 |
| Input and errors | Bounded Zod validation, request-body limits, no-store responses, and sanitized server errors                                                    |

These controls are defense in depth. An operation allowlist does not replace API authorization, and user approval does not establish identity or data ownership.

## Demo personas are not authentication

`@repo/demo-auth` contains two fixed principals:

- Avery Morgan, role `customer`, principal ID `usr_customer_avery`.
- Riley Chen, role `admin`, principal ID `usr_admin_riley`.

`POST /api/persona` accepts either role and mints a signed 12-hour session cookie. It requires no existing login, identity proof, admin entitlement, or external authorization. The Next.js proxy also creates the customer cookie automatically when a request has no valid demo session.

`DEMO_AUTH_SECRET` prevents cookie tampering. It does not prevent any visitor
from selecting the admin persona through the intended endpoint. Treat the
switcher as a role-scoping demonstration only.

Before production, remove the fixed personas, automatic customer fallback, and open persona endpoint. Replace them with a verified application session whose roles and workspace memberships come from an authoritative identity and authorization system.

## Eve route auth has no session-ownership ACL

Both public Eve prefixes expose session creation, continuation, cancellation, reset, clear, compact, and streaming routes. The channel authenticates each inbound request, but Eve route auth does not add a per-user ownership access-control list (ACL) to a durable session.

The direct-route limitation is significant:

1. `customerSessionAuth` or `adminSessionAuth` verifies the caller's current cookie and role.
2. Eve accepts or rejects the route based on that current request identity.
3. Eve does not automatically verify that the caller owns the referenced `sessionId` or created the continuation.
4. Application code must enforce any user, tenant, or session ownership policy beyond route auth.

The fixed demo has one principal per role, which masks this issue. In a multi-user system, a same-role caller who obtains another session identifier could reach that session unless you add an ownership check or place an enforcing gateway in front of the Eve routes.

For production, bind each Eve session to a stable subject and workspace when it starts. Reject continuation, control, and stream requests whose current principal does not match the stored owner and tenant. Test cross-user and cross-workspace denial directly against every session route.

## Service bindings grant reachability, not identity

The `COMMERCE_URL` binding grants `web`, `eve-customer`, and `eve-admin` internal network access to `commerce`. It does not authenticate or authorize those callers.

Vercel documents two important binding properties:

- A binding does not create public ingress to the target.
- Internal calls skip the public request pipeline, including Firewall, Deployment Protection, top-level middleware, and CDN request accounting.

The commerce JWT is therefore required even on the internal path. Keep role and resource checks in Nitro; do not rely on the service being private.

A service binding is available to runtime functions only. It is not available during builds or from Routing Middleware. This repository calls commerce from Next.js server code and Eve/Nitro runtime code, while `apps/web/proxy.ts` handles only the demo cookie.

## Binding URL protocol must be verified

Eve 0.29.5 rejects an OpenAPI base URL unless it uses HTTPS or loopback HTTP. Vercel's current binding reference defines `format: "url"` as an absolute URL but does not state the generated protocol.

[Portless](https://portless.sh) gives the browser a trusted local HTTPS and HTTP/2 endpoint. It does not change the internal `COMMERCE_URL` that Vercel CLI injects at runtime. Local loopback HTTP remains acceptable to Eve, while a non-loopback deployment URL must use HTTPS.

The preview acceptance test sent OpenAPI requests through both Eve services to
`commerce`. Eve accepted the generated binding URL, and the seeded catalog,
cart, inventory, and agent operations completed successfully. Never log the
complete binding URL or headers.

## Auth layers and their limits

| Mechanism      | What it authenticates                            | Current limitation                                                                |
| -------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| Demo cookie    | Browser persona presented to `web` and Eve       | Any visitor can mint either persona                                               |
| `vercelOidc()` | A Vercel-issued caller accepted by the Eve route | Connection auth still requires `authenticator: "demo-session"` for commerce tools |
| `localDev()`   | A local caller accepted by Eve 0.29.5            | Development-only and not a user identity                                          |
| Commerce JWT   | Web or demo user identity presented to Nitro     | Shared HMAC secret and fixed demo authorization model                             |
| Tool approval  | Human decision for one proposed input            | Does not authenticate the approver or establish session ownership                 |

The installed Eve 0.29.5 documentation says `localDev()` accepts loopback hostnames and a `vercel dev` exception. It also warns that a directly exposed origin can trust a spoofed `Host` header if no normalizing proxy sits in front. Portless 0.15.5 listens on loopback by default, but its trusted local CA and proxy are development infrastructure, not an application authentication boundary. Keep raw development listeners private and verify behavior again when upgrading Eve; current upstream docs describe a newer process-flag implementation.

Starting the shared Portless proxy on port 443 may require `sudo`, and first use may prompt to trust its local CA. Run `pnpm portless:doctor` before changing trust or proxy state, and use `pnpm portless:stop` to stop the shared proxy.

## Secrets and generated values

| Variable            | Type                   | Required scope                                                                 |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`      | Secret                 | Consumed only by `commerce` and trusted migration or seed commands             |
| `DEMO_AUTH_SECRET`  | Secret                 | Shared by all four services so they can verify or mint demo JWTs               |
| `VERCEL_OIDC_TOKEN` | Short-lived credential | Managed or pulled by Vercel tooling for linked-project AI Gateway access       |
| `COMMERCE_URL`      | Generated binding URL  | Injected by Vercel into `web`, `eve-customer`, and `eve-admin`; never user-set |

Keep secret values out of source control, logs, model prompts, tool results,
browser bundles, and generated OpenAPI files. AI Gateway access uses Vercel
OIDC. The agents reject `AI_GATEWAY_API_KEY` so an old key cannot silently take
precedence.

Vercel Services share project environment configuration. Runtime queries read
`DATABASE_URL` in Nitro, and Drizzle CLI configuration reads the same variable
for migrations. Code-level ownership does not prove process-level secret
isolation. **[VERIFY]** Confirm the platform's current service-specific
environment scoping before relying on it as a secret boundary. If strict
isolation is required, expose the database credential only to `commerce`.

## Commerce and operational omissions

The reference intentionally omits checkout and payment. It also does not implement production-grade refunds, fulfillment, tax calculation, shipping calculation, payment-card handling, order creation, or inventory reservation at checkout.

Other production controls are also absent:

- Rate limits, abuse controls, and per-principal quotas for web and Eve routes.
- A durable, tamper-resistant audit log for persona changes, approvals, and mutations.
- Idempotency keys for external or non-idempotent side effects.
- Production monitoring, alerting, backup, restore, and disaster-recovery procedures.
- A retention and deletion policy for Eve sessions, model traffic, traces, and commerce data.

## Model and API content

Commerce responses enter the model context when an agent calls an OpenAPI
operation. Treat product names, descriptions, and future customer-authored
fields as untrusted input. The agent instructions tell the model not to follow
instructions in those fields. Keep fields bounded and escape model output
before rendering it as markup.

The demo UI displays model reasoning and raw tool inputs and outputs. Remove or
redact these views before using sensitive data.

## AI Gateway reporting tags

The customer root sends the tag
`multi-agent-services:customer-agent`. The admin root sends
`multi-agent-services:admin-agent`. The tags are mutually exclusive, so the
cost report can attribute requests by root without double-counting them.

Custom Reporting is account-wide and may charge for writes and queries. It is
available only on supported Vercel plans. Data can take several minutes to
appear. Historical requests without these tags do not appear in the agent rows.

The current agents reduce exposure by disabling shell, filesystem, web, and delegation tools. Adding any tool or connection expands the model's reachable data and side effects; review auth, approvals, output bounds, and prompt-injection handling for each addition.

## Beta and version caveats

| Dependency      | Pinned version                   | Caveat                                                                                               |
| --------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Portless        | `0.15.5`                         | Pre-1.0 proxy behavior, state, and CA trust requirements can change; review upgrades before trusting |
| Eve             | `0.29.5`                         | Pre-1.0 agent APIs and current upstream docs can change independently of this repository             |
| Nitro           | `3.0.260610-beta`                | Beta server and Vercel adapter behavior can change between date-stamped releases                     |
| Vercel Services | Current `services` configuration | Requires Services permission; bindings and routing should be validated in preview before production  |

The installed Eve package itself depends on the same Nitro beta. Upgrade Eve and Nitro together only after reviewing release notes, generated routes, OpenAPI behavior, approval events, and type changes. Keep Portless pinned while it is pre-1.0; after an upgrade, run `pnpm portless:doctor` and re-establish CA trust if the release requires it.

## Pre-production checklist

### Identity and authorization

- [ ] Replace demo personas and `POST /api/persona` with real sign-in and server-side role membership.
- [ ] Add per-session ownership and tenant ACL checks to every Eve continuation, control, and stream route.
- [ ] Replace the shared demo HMAC design with a managed signing and verification model, including key rotation.
- [ ] Add CSRF and origin controls to browser mutations and session endpoints as required by the chosen auth system.
- [ ] Test cross-role, cross-user, cross-workspace, expired-token, and replay denial.

### Data and operations

- [ ] Scope `DATABASE_URL` to `commerce` at the deployment boundary and verify no other service receives it.
- [ ] Add rate limiting, audit logs, idempotency, monitoring, and incident procedures.
- [ ] Define retention, deletion, backup, restore, and model-provider data policies.
- [ ] Validate `COMMERCE_URL` protocol and internal call behavior in preview.
- [ ] Keep checkout and payment disabled until a separately reviewed transactional design exists.

## Related documentation

- [Architecture](architecture.md)
- [Eve root agents](eve-root-agents.md)
- [OpenAPI connection](openapi-connection.md)
- [Portless](https://portless.sh)
- [Eve auth and route protection](https://eve.dev/docs/guides/auth-and-route-protection)
- [Vercel service bindings](https://vercel.com/docs/services/bindings)
