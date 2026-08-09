# Documentation

Use this index to find setup, architecture, integration, operations, and
extension guidance for the multi-agent services template.

> [!WARNING]
> The template demonstrates service and agent boundaries. It is not production
> authentication, authorization, or commerce software.

## Start and operate the reference

| Page                                      | Use it to                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| [Getting started](getting-started.md)     | Configure PostgreSQL, Portless HTTPS, and the local Services topology    |
| [Deployment](deployment.md)               | Configure and deploy the four Vercel services as one project             |
| [Testing and evals](testing-and-evals.md) | Run verified checks and understand current test gaps                     |
| [Troubleshooting](troubleshooting.md)     | Diagnose Portless, bindings, auth, database, routing, and agent failures |

## Understand the design

| Page                                            | Use it to                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| [Architecture](architecture.md)                 | Trace public routing, private service calls, auth, and data ownership            |
| [Eve root agents](eve-root-agents.md)           | Compare root agents, declared subagents, built-in root copies, and remote agents |
| [OpenAPI connection](openapi-connection.md)     | Follow the canonical contract from YAML to role-scoped Eve tools                 |
| [Security and caveats](security-and-caveats.md) | Review trust boundaries, known limitations, secrets, and pre-production work     |

## Change the reference

| Page                          | Use it to                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------- |
| [Extending](extending.md)     | Add a root agent, service, commerce operation, or production identity system      |
| [Customizing](customizing.md) | Rename the demo, replace identity, change agents, or change the commerce contract |

## App references

- [`apps/web`](../apps/web/README.md) owns the storefront and demo session surface.
- [`apps/commerce`](../apps/commerce/README.md) owns the private Nitro API and PostgreSQL access.
- [`apps/customer-agent`](../apps/customer-agent/README.md) owns the customer Eve root agent.
- [`apps/admin-agent`](../apps/admin-agent/README.md) owns the admin Eve root agent.

## Reuse and assets

- [Stock photo sources](stock-photo-credits.md) lists the product image sources.
- [MIT License](../LICENSE) covers the source code.
- [Third-party notices](../THIRD-PARTY-NOTICES.md) covers the included fonts and assets.

## External references

- [Vercel Services](https://vercel.com/docs/services)
- [Vercel service bindings](https://vercel.com/docs/services/bindings)
- [Portless](https://portless.sh)
- [Eve documentation](https://eve.dev/docs)
- [Nitro routing](https://nitro.build/guide/routing)
- [Nitro on Vercel](https://nitro.build/deploy/providers/vercel)
