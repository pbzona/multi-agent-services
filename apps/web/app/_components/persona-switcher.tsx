"use client";

import type { DemoRole } from "@repo/demo-auth";
import { useState } from "react";

export function PersonaSwitcher({ role }: { role: DemoRole }) {
  const [pendingRole, setPendingRole] = useState<DemoRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function switchPersona(nextRole: DemoRole) {
    if (nextRole === role || pendingRole) return;
    setPendingRole(nextRole);
    setError(null);

    try {
      const response = await fetch("/api/persona", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!response.ok) throw new Error("Persona switch failed.");
      window.location.assign(nextRole === "admin" ? "/admin" : "/");
    } catch (cause) {
      setPendingRole(null);
      setError(
        cause instanceof Error ? cause.message : "Persona switch failed.",
      );
    }
  }

  return (
    <div className="persona-wrap">
      <div aria-label="Demo persona" className="persona-switcher" role="group">
        {(["customer", "admin"] as const).map((option) => (
          <button
            aria-pressed={role === option}
            className="persona-option"
            disabled={pendingRole !== null}
            key={option}
            onClick={() => switchPersona(option)}
            type="button"
          >
            {pendingRole === option ? "Switching" : option}
          </button>
        ))}
      </div>
      {error ? (
        <span className="persona-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
