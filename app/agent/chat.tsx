"use client";

import { useState } from "react";

interface Result {
  text: string;
  model: string;
  steps: { tool: string; ok: boolean; output: string }[];
}

export function Chat() {
  const [prompt, setPrompt] = useState("Check my balances, then preview swapping 0.0001 ETH to USDC and tell me what you would get.");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>();
  const [error, setError] = useState<string>();

  const ask = async () => {
    setBusy(true);
    setError(undefined);
    setResult(undefined);
    try {
      const res = await fetch("/api/agent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setResult(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="agent-title">
      <h2 id="agent-title">Agent</h2>
      <p className="muted">An LLM with a Base Sepolia wallet and four tools (balance, transfer, quote, swap). Every call is capped and checked by the policy engine, and this page is dry-run only: nothing is sent.</p>
      <label className="field">
        Task
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </label>
      <button type="button" className="ck-button" disabled={busy || !prompt.trim()} onClick={ask}>
        {busy ? "Working…" : "Ask the agent"}
      </button>
      {error && (
        <p role="alert" className="ck-error">
          {error}
        </p>
      )}
      {result && (
        <>
          <p className="muted">Answered by {result.model}</p>
          <p className="mono" data-testid="answer">
            {result.text}
          </p>
          <ol className="steps">
            {result.steps.map((s, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: steps only ever append
              <li key={i} className="mono">
                {s.ok ? "✓" : "✗"} {s.tool}: {s.output}
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
