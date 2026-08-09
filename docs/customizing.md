# Customize the template

Replace the demo identity, store data, names, and routes before sharing a
deployment. Keep the service and authorization boundaries intact while you
change the product domain.

## Rename the visible application

Update these values together:

- `Field & Form` in the web metadata, header, footer, seed workspace, and docs.
- `multi-eve` in `portless.json`, local URLs, and local setup instructions.
- The photo files and entries in `product-artwork.tsx`.
- The product and variant definitions in `apps/commerce/server/db/seed-data.ts`.

The `.example` hostnames in development data are placeholders. Use local paths
for bundled images or real HTTPS URLs that your deployment allows.

## Replace demo identity

The demo identity lives in `packages/demo-auth` and `apps/web/proxy.ts`.
Replace all of these parts:

1. Fixed personas and their roles.
2. Automatic customer fallback.
3. `POST /api/persona`.
4. Shared HMAC signing and the `DEMO_AUTH_SECRET` exchange.
5. Eve channel auth and commerce authorization tests.

Keep role and workspace membership server-side. Do not accept them from a
prompt, request body, or client cookie.

## Add or rename an Eve root

Use one identifier for the package, service, browser client, and public route.
For example:

```text
Package: apps/fulfillment-agent
Service: eve-fulfillment
Browser agent: fulfillment
Public route: /eve/agents/fulfillment/eve/v1/*
Local host: https://fulfillment.multi-eve.localhost
```

Update `vercel.json`, `portless.json`, the web client, the channel auth policy,
the operation allowlist, the agent instructions, and the tests together.

Give the root its own Gateway reporting tag. Use a stable prefix and one tag per
request so cost rows remain attributable.

## Change the model

Edit the root's `agent/agent.ts`. Gateway model IDs use the
`creator/model` format. Keep the `modelOptions.providerOptions.gateway.tags`
entry when you change the model. This repository uses Vercel OIDC and does not
support `AI_GATEWAY_API_KEY`.

## Change the commerce contract

1. Edit `packages/commerce-contract/openapi.yaml`.
2. Regenerate artifacts with `pnpm openapi:generate`.
3. Add the operation only to the roots that need it.
4. Classify reads and writes in the connection approval policy.
5. Add route, validation, authorization, and response tests.
6. Run `pnpm openapi:check`.

Keep `commerce` private. A service binding provides reachability, not
authorization.
