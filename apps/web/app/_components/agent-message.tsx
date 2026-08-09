"use client";

import type {
  EveDynamicToolPart,
  EveMessage,
  EveMessageInputRequest,
} from "eve/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckIcon } from "./icons";

export type InputReply = {
  optionId?: string;
  requestId: string;
  text?: string;
};

function readableName(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function toolStatus(part: EveDynamicToolPart): string {
  switch (part.state) {
    case "output-available":
      return "Complete";
    case "output-error":
      return "Failed";
    case "output-denied":
      return "Declined";
    case "approval-requested":
      return "Approval needed";
    case "approval-responded":
      return "Resuming";
    default:
      return "Running";
  }
}

function toDisplayJson(value: unknown): string {
  if (value === undefined) return "Waiting for input";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "Result received";
  }
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function approvalPrompt(
  request: EveMessageInputRequest,
  toolInput: unknown,
  toolName: string,
): string {
  if (request.kind !== "tool-approval") return request.prompt;

  const input = recordValue(toolInput);
  const body = recordValue(input?.body);
  const path = recordValue(input?.path);
  if (
    toolName.endsWith("setCartItemQuantity") &&
    typeof body?.quantity === "number"
  ) {
    const variant = path?.variantId ?? input?.variantId;
    return `Set ${variant ? `variant ${String(variant)} ` : "this cart item "}quantity to ${body.quantity}?`;
  }
  if (
    toolName.endsWith("setInventoryLevel") &&
    typeof body?.quantity === "number"
  ) {
    const variant = path?.variantId ?? input?.variantId;
    const version = body.expectedVersion;
    return `Set ${variant ? `variant ${String(variant)} ` : "this variant's "}on-hand inventory to ${body.quantity} (version ${version})?`;
  }
  if (toolName.endsWith("updateProduct")) {
    const product = path?.productId ?? input?.productId;
    const changes = Object.keys(body ?? {}).join(", ");
    return `Update ${product ? `product ${String(product)}` : "this product"}${changes ? ` (${changes})` : ""}?`;
  }

  return `Approve ${readableName(toolName)}?`;
}

function ApprovalOptions({
  disabled,
  onReply,
  request,
  toolInput,
  toolName,
}: {
  disabled: boolean;
  onReply: (reply: InputReply) => void;
  request: EveMessageInputRequest;
  toolInput: unknown;
  toolName: string;
}) {
  return (
    <div className="approval-card">
      <p>{approvalPrompt(request, toolInput, toolName)}</p>
      {request.options?.length ? (
        <div className="approval-options">
          {request.options.map(
            (
              option: NonNullable<EveMessageInputRequest["options"]>[number],
            ) => (
              <button
                className={
                  option.style === "primary"
                    ? "button button-primary button-small"
                    : option.style === "danger"
                      ? "button button-danger button-small"
                      : "button button-secondary button-small"
                }
                disabled={disabled}
                key={option.id}
                onClick={() =>
                  onReply({ requestId: request.requestId, optionId: option.id })
                }
                title={option.description}
                type="button"
              >
                {option.label}
              </button>
            ),
          )}
        </div>
      ) : null}
      {request.allowFreeform || request.display === "text" ? (
        <form
          className="approval-freeform"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const text = String(form.get("approval-text") ?? "").trim();
            if (text) onReply({ requestId: request.requestId, text });
          }}
        >
          <label className="sr-only" htmlFor={`approval-${request.requestId}`}>
            Response
          </label>
          <input
            disabled={disabled}
            id={`approval-${request.requestId}`}
            name="approval-text"
            placeholder="Type a response"
          />
          <button
            className="button button-primary button-small"
            disabled={disabled}
            type="submit"
          >
            Reply
          </button>
        </form>
      ) : null}
    </div>
  );
}

function ToolCall({
  disabled,
  onReply,
  part,
}: {
  disabled: boolean;
  onReply: (reply: InputReply) => void;
  part: EveDynamicToolPart;
}) {
  const request = part.toolMetadata?.eve?.inputRequest;
  const isComplete = part.state === "output-available";
  const isError = part.state === "output-error";

  return (
    <div className="tool-call">
      <details open={Boolean(request && part.state === "approval-requested")}>
        <summary>
          <span
            className={`tool-indicator${isComplete ? " is-complete" : ""}${isError ? " is-error" : ""}`}
          >
            {isComplete ? <CheckIcon /> : null}
          </span>
          <span>{readableName(part.toolName)}</span>
          <span className="tool-status">{toolStatus(part)}</span>
        </summary>
        <div className="tool-detail">
          {part.input !== undefined ? (
            <>
              <span>Input</span>
              <pre>{toDisplayJson(part.input)}</pre>
            </>
          ) : null}
          {part.state === "output-available" ? (
            <>
              <span>Result</span>
              <pre>{toDisplayJson(part.output)}</pre>
            </>
          ) : null}
          {part.state === "output-error" ? (
            <p className="tool-error">{part.errorText}</p>
          ) : null}
        </div>
      </details>
      {request && part.state === "approval-requested" ? (
        <ApprovalOptions
          disabled={disabled}
          onReply={onReply}
          request={request}
          toolInput={part.input}
          toolName={part.toolName}
        />
      ) : null}
    </div>
  );
}

export function AgentMessage({
  disabled,
  message,
  onReply,
}: {
  disabled: boolean;
  message: EveMessage;
  onReply: (reply: InputReply) => void;
}) {
  return (
    <article className={`agent-message message-${message.role}`}>
      <span className="message-role">
        {message.role === "assistant" ? "Assistant" : "You"}
      </span>
      <div className="message-content">
        {message.parts.map(
          (part: EveMessage["parts"][number], index: number) => {
            const key = `${message.id}-${part.type}-${index}`;
            if (part.type === "text") {
              return (
                <div className="message-markdown" key={key}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              );
            }
            if (part.type === "reasoning") {
              return (
                <details className="reasoning" key={key}>
                  <summary>Reasoning</summary>
                  <p>{part.text}</p>
                </details>
              );
            }
            if (part.type === "dynamic-tool") {
              return (
                <ToolCall
                  disabled={disabled}
                  key={key}
                  onReply={onReply}
                  part={part}
                />
              );
            }
            if (part.type === "authorization") {
              return (
                <div className="approval-card" key={key}>
                  <p>{part.description}</p>
                  {part.state === "required" && part.authorization?.url ? (
                    <a
                      className="button button-secondary button-small"
                      href={part.authorization.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Connect {part.displayName}
                    </a>
                  ) : null}
                  {part.state === "completed" ? (
                    <p>{readableName(part.outcome)}</p>
                  ) : null}
                </div>
              );
            }
            return null;
          },
        )}
      </div>
    </article>
  );
}
