import { paywall } from "@codkit/pay/hono";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { agentWallet, runAgent } from "@/lib/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

const app = new Hono().basePath("/api");

// A paid endpoint: x402 on Base Sepolia, settled by the public testnet facilitator.
// A caller without a payment gets HTTP 402 and the price; `pnpm check:paid` pays it.
app.use(
  paywall({
    payTo: (process.env.PAY_TO as `0x${string}` | undefined) ?? (process.env.AGENT_PRIVATE_KEY ? agentWallet().account.address : "0x2222222222222222222222222222222222222222"),
    routes: { "GET /api/paid/price": { price: "$0.001", description: "ETH price" } },
  }),
);
app.get("/paid/price", (c) => c.json({ asset: "ETH", usd: 3120.55, at: new Date().toISOString() }));

app.post("/agent", async (c) => {
  const { prompt } = (await c.req.json().catch(() => ({}))) as { prompt?: string };
  if (!prompt?.trim()) return c.json({ error: "prompt is required" }, 400);
  try {
    return c.json(await runAgent(prompt.trim().slice(0, 1000)));
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
