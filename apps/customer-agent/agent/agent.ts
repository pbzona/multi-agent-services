import { defineAgent } from "eve";

if (process.env.AI_GATEWAY_API_KEY?.trim()) {
  throw new Error(
    "AI_GATEWAY_API_KEY is not supported. Link the project and use Vercel OIDC.",
  );
}

export default defineAgent({
  model: "anthropic/claude-sonnet-5",
  modelOptions: {
    providerOptions: {
      gateway: {
        tags: ["multi-agent-services:customer-agent"],
      },
    },
  },
});
