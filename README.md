# codkit test app

A hackathon-style Next.js app that lives **outside** the [codkit](https://github.com/deyoungjohn/codkit) workspace and installs `@codkit/*` **from npm**. It exists to prove the packages work the way a team actually gets them: from the registry, in a fresh repo, with no workspace links.

| Page / route | Packages it exercises |
| --- | --- |
| `/` Wallets | `@codkit/wallet` (EVM + Solana behind one hook), `@codkit/ui` (ConnectButton, ChainSwitcher, TokenAmountInput, toasts), `@codkit/config` |
| `/agent` + `POST /api/agent` | `@codkit/agent-tools` (balance, quote, swap on Uniswap v3), `@codkit/policy` (caps), `@codkit/mcp/ai-sdk` and `/agent` (AI SDK tools, provider from env) |
| `GET /api/paid/price` | `@codkit/pay/hono` (x402 paywall on Base Sepolia, public testnet facilitator) |
| `pnpm check:paid` | `@codkit/pay` budgeted client + `@codkit/policy`: pays the endpoint above from the agent wallet |

Testnets only: Base Sepolia and Solana devnet. The agent page is **dry-run only**.

## Run it

```bash
pnpm install
cp .env.example .env     # AGENT_PRIVATE_KEY (a Base Sepolia TEST key), an LLM key, LLM_PROVIDER=gemini
pnpm dev                 # http://localhost:3000
pnpm check:paid          # in another terminal; settles a 0.001 USDC x402 payment on Base Sepolia
```

## What building it found

Each of these came from using the published packages cold. See the codkit repo's `PROGRESS.md` for what was done about them.

1. **`@codkit/agent-tools` 0.1.0 rejects chain-specific viem clients.** `createPublicClient({ chain: baseSepolia })` doesn't type-check against `evmChain` (Base and OP chains have an extra transaction type). Fixed in the codkit repo (patch changeset); until that is released, `lib/agent.ts` casts the clients `as never`.
2. **`@codkit/pay` pins `@x402/*` at `~2.28`; the latest is 2.32.** A plain `pnpm add @x402/hono` installs a second copy of x402 next to the one `@codkit/pay` brings. Install `@x402/hono@~2.28.0` and don't add `@x402/core` or `@x402/evm` yourself.
3. **pnpm's release-age gate hides fresh releases.** A new project resolved `@codkit/mcp` 0.2.2 and `@codkit/ui` 0.1.2 (the days-old 0.3.0 and 0.1.3 were skipped). Pin the version explicitly (pnpm then adds an exclusion).
4. **pnpm 12 refuses to install when a build script is unapproved** (`esbuild`, pulled in by `tsx`). Run `pnpm approve-builds --all`.
5. **Groq's reasoning models fail multi-step tool calls through the AI SDK** (`reasoning_content` is rejected on the replayed assistant message), and `providersFromEnv()` puts Groq first. Set `LLM_PROVIDER=gemini`.
6. **Open, not reproduced:** in a real Chrome with 11 wallet extensions, the dev server logged a hydration mismatch in the wallet picker (the server rendered "no wallet found", the client a list). The same app and a decoy-wallet browser test in codkit (wallets announced before hydration, dev and production) don't reproduce it.
