"use client";

import type { InputResponse } from "eve/client";
import {
  useEveAgent,
  type EveMessage,
  type EveMessageData,
  type UseEveAgentHelpers,
  type UseEveAgentSnapshot,
} from "eve/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AgentMessage, type InputReply } from "./agent-message";
import { ChatIcon, CloseIcon, SendIcon } from "./icons";

const WRITE_TOOL = /(?:add|adjust|cancel|create|delete|remove|set|update)/i;

function refreshCompletedWrites(
  snapshot: UseEveAgentSnapshot<EveMessageData>,
  seenWrites: Set<string>,
  refresh: () => void,
) {
  let hasNewWrite = false;

  for (const message of snapshot.data.messages) {
    for (const part of message.parts) {
      if (
        part.type !== "dynamic-tool" ||
        part.state !== "output-available" ||
        !WRITE_TOOL.test(part.toolName) ||
        seenWrites.has(part.toolCallId)
      ) {
        continue;
      }
      const output =
        part.output !== null && typeof part.output === "object"
          ? (part.output as { status?: unknown })
          : null;
      if (
        typeof output?.status === "number" &&
        (output.status < 200 || output.status >= 300)
      ) {
        seenWrites.add(part.toolCallId);
        continue;
      }
      seenWrites.add(part.toolCallId);
      hasNewWrite = true;
    }
  }

  if (hasNewWrite) refresh();
}

type AgentPanelProps = {
  agent: UseEveAgentHelpers<EveMessageData>;
  contextLabel: string;
  emptyPrompts: readonly string[];
  title: string;
};

function AgentPanelView({
  agent,
  contextLabel,
  emptyPrompts,
  title,
}: AgentPanelProps) {
  const pathname = usePathname();
  const messagesContainer = useRef<HTMLDivElement>(null);
  const isBusy = agent.status === "submitted" || agent.status === "streaming";

  useEffect(() => {
    const container = messagesContainer.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [agent.data.messages, agent.status]);

  function replyToInput(reply: InputReply) {
    void agent.send({ inputResponses: [reply as InputResponse] });
  }

  function sendMessage(message: string) {
    if (!message.trim() || isBusy) return;
    void agent.send({
      message: message.trim(),
      clientContext: { route: pathname, surface: contextLabel },
    });
  }

  return (
    <div className="agent-panel-inner">
      <div className="agent-heading">
        <div>
          <span className="agent-kicker">
            <span className="status-dot" /> Live agent
          </span>
          <h2>{title}</h2>
        </div>
        <button className="text-button" onClick={agent.reset} type="button">
          New chat
        </button>
      </div>

      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="agent-messages"
        ref={messagesContainer}
      >
        {agent.data.messages.length === 0 ? (
          <div className="agent-empty">
            <p>
              Ask in plain language. The agent can inspect live store data and
              propose actions.
            </p>
            <div className="prompt-list">
              {emptyPrompts.map((prompt) => (
                <button
                  disabled={isBusy}
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          agent.data.messages.map((message: EveMessage) => (
            <AgentMessage
              disabled={isBusy}
              key={message.id}
              message={message}
              onReply={replyToInput}
            />
          ))
        )}
        {isBusy ? (
          <div className="agent-loading" role="status">
            <span />
            <span />
            <span />
            <span className="sr-only">Agent is working</span>
          </div>
        ) : null}
        {agent.status === "error" ? (
          <div className="agent-error" role="alert">
            <strong>Agent connection failed</strong>
            <span>{agent.error?.message ?? "Try again in a moment."}</span>
          </div>
        ) : null}
      </div>

      <form
        className="agent-composer"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const message = String(form.get("agent-message") ?? "");
          if (message.trim()) {
            sendMessage(message);
            event.currentTarget.reset();
          }
        }}
      >
        <label className="sr-only" htmlFor={`agent-message-${contextLabel}`}>
          Message {title}
        </label>
        <textarea
          disabled={isBusy}
          id={`agent-message-${contextLabel}`}
          name="agent-message"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Ask the agent…"
          rows={1}
        />
        <button
          aria-label="Send message"
          className="send-button"
          disabled={isBusy}
          type="submit"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

function CustomerAgentPanel() {
  const router = useRouter();
  const seenWrites = useRef(new Set<string>());
  const agent = useEveAgent({
    agent: "customer",
    onFinish(snapshot: UseEveAgentSnapshot<EveMessageData>) {
      refreshCompletedWrites(snapshot, seenWrites.current, () =>
        router.refresh(),
      );
    },
  });

  return (
    <AgentPanelView
      agent={agent}
      contextLabel="storefront"
      emptyPrompts={[
        "Find a useful gift under $100",
        "What is currently in my cart?",
        "Compare the desk accessories",
      ]}
      title="Store assistant"
    />
  );
}

export function CustomerAgentDock({ role }: { role: "admin" | "customer" }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (role !== "customer" || pathname.startsWith("/admin")) return null;

  return (
    <aside className={`agent-dock${isOpen ? " is-open" : ""}`}>
      <div className="agent-popover" hidden={!isOpen}>
        <button
          aria-label="Close store assistant"
          className="agent-close"
          onClick={() => setIsOpen(false)}
          type="button"
        >
          <CloseIcon />
        </button>
        <CustomerAgentPanel />
      </div>
      <button
        aria-expanded={isOpen}
        className="agent-trigger"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <ChatIcon />
        <span>Ask Form</span>
      </button>
    </aside>
  );
}

export function AdminAgentPanel() {
  const router = useRouter();
  const seenWrites = useRef(new Set<string>());
  const agent = useEveAgent({
    agent: "admin",
    onFinish(snapshot: UseEveAgentSnapshot<EveMessageData>) {
      refreshCompletedWrites(snapshot, seenWrites.current, () =>
        router.refresh(),
      );
    },
  });

  return (
    <section className="admin-agent-panel">
      <AgentPanelView
        agent={agent}
        contextLabel="admin"
        emptyPrompts={[
          "Which products need attention?",
          "Summarize low-stock variants",
          "Set a safe reorder plan",
        ]}
        title="Inventory agent"
      />
    </section>
  );
}
