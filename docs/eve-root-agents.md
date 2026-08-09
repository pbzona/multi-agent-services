# Why customer and admin are separate Eve root agents

`customer-agent` and `admin-agent` are independently addressed Eve root agents. They are not children of a coordinator and do not delegate work to each other.

## Current root-agent boundaries

| Boundary           | Customer root                                  | Admin root                           |
| ------------------ | ---------------------------------------------- | ------------------------------------ |
| App root           | `apps/customer-agent`                          | `apps/admin-agent`                   |
| Vercel service     | `eve-customer`                                 | `eve-admin`                          |
| Browser identifier | `customer`                                     | `admin`                              |
| Public prefix      | `/eve/agents/customer/eve/v1/*`                | `/eve/agents/admin/eve/v1/*`         |
| Required demo role | `customer`                                     | `admin`                              |
| Business scope     | Catalog, current cart, current-customer orders | Catalog, products, inventory         |
| Write approvals    | `setCartItemQuantity`                          | `updateProduct`, `setInventoryLevel` |

Both roots use `anthropic/claude-sonnet-5` through a string model ID. Both disable Eve's built-in `agent`, `bash`, `glob`, `grep`, `read_file`, `write_file`, `web_fetch`, and `web_search` tools with authored files under `agent/tools/`. They retain Eve's connection discovery and human-input behavior so they can find allowed commerce operations and request approval.

## Why a root agent fits each persona

The browser starts the customer or admin session directly with `useEveAgent({ agent: "customer" })` or `useEveAgent({ agent: "admin" })`. Each target therefore needs a root-owned Eve channel.

Separate roots provide four controls that a subagent does not:

- **Independent ingress:** Each persona has a public route prefix and receives browser requests without a parent agent.
- **Independent route auth:** `customerSessionAuth` and `adminSessionAuth` reject the wrong role before model work begins.
- **Independent least privilege:** Each root compiles a different OpenAPI operation allowlist and write-approval policy.
- **Independent runtime boundary:** Each root builds as a separate Vercel service with its own sessions, failures, scaling, and observability.

There is no task that one persona should delegate to the other. Customer and admin are separate authorities, not specialists working under one authority.

## Compare Eve agent forms

| Form               | Started by                               | Runtime boundary                                       | Capability source                                                                       | HTTP channel                        | Fit for this repository                                                        |
| ------------------ | ---------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| Root agent         | Browser, channel, client, or schedule    | Top-level Eve app and service                          | Root `agent/` directory                                                                 | Yes                                 | Used for both personas                                                         |
| Built-in root copy | Root model through the `agent` tool      | Child session in the same app                          | Copies root instructions, connections, auth, tools, and sandbox, except root-only tools | No                                  | Disabled in both roots                                                         |
| Declared subagent  | Parent model through a path-derived tool | Child session discovered under `agent/subagents/<id>/` | Its own authored slots; absent slots use framework defaults                             | No                                  | Wrong because no parent should mediate persona access                          |
| Remote agent       | Parent model through `defineRemoteAgent` | Separately deployed Eve app                            | Capabilities owned by the remote deployment                                             | Remote app has its own root channel | Useful only if a future coordinator delegates to a separately owned specialist |

### Built-in root copies

Eve normally gives a root session the built-in `agent` tool. A call starts a fresh copy of the same root with fresh conversation history and state. The child inherits the root's instructions, connections, auth, and sandbox, but it cannot recursively call the root-only `agent` or `Workflow` tools.

This repository overrides the built-in tool at both of these paths:

```text
apps/customer-agent/agent/tools/agent.ts
apps/admin-agent/agent/tools/agent.ts
```

Each file exports `disableTool()`. The agent instructions also state that the root must not delegate.

### Declared subagents

A declared subagent lives under `agent/subagents/<id>/`. Its directory location marks it as a subagent, and its path becomes a model-visible tool name. Declared subagents own their instructions, tools, connections, skills, sandbox, hooks, and nested subagents; they do not inherit authored root slots.

Declared subagents cannot own channels or schedules. A customer or admin subagent would therefore require a parent root to authenticate the browser, decide which persona tool to call, package the conversation into a delegation message, and return the result. That extra coordinator would weaken the direct role boundary and add no capability here.

### Remote agents

`defineRemoteAgent` exposes a separately deployed Eve root as a delegation tool. The parent starts a task-mode session on the remote deployment, parks while the remote runs, and resumes from a callback.

Remote-agent transport auth authenticates the calling deployment. Forwarding the end-user principal is separate and requires `forwardPrincipal: true` plus a precise `trustedForwarders` policy on the receiver. The current browser routes already call the intended root directly, so remote delegation would add callback, identity-forwarding, and lifecycle complexity without replacing either public root.

## When to introduce a subagent

Add a declared subagent only when one existing root needs to delegate an internal task that meets at least one of these conditions:

- The task needs specialist instructions that should not shape the root conversation.
- The task needs a narrower tool or connection surface.
- The task should run independently or in parallel within the same user request.
- The task needs its own sandbox or runtime context.

Do not use a subagent only to represent a user role. Authenticate user roles at the channel boundary and authorize every downstream operation.

## When to add another root agent

Add a root when the new agent needs its own direct channel, independent auth policy, operation boundary, or service lifecycle. Follow the [root-agent extension recipe](extending.md#add-an-eve-root-agent).

## Version caveat

The implementation pins `eve@0.29.5`, and `eve info --json` reports no discovered subagents for either app. Eve is pre-1.0, while the current documentation at `eve.dev` can describe behavior added after 0.29.5. Treat the installed package documentation under `node_modules/eve/docs/` and the installed type declarations as authoritative for this repository, then re-run discovery, type checks, evals, and route tests after every Eve upgrade.

## Related documentation

- [Architecture](architecture.md)
- [OpenAPI connection](openapi-connection.md)
- [Security and caveats](security-and-caveats.md)
- [Eve subagents](https://eve.dev/docs/subagents)
- [Eve remote agents](https://eve.dev/docs/guides/remote-agents)
