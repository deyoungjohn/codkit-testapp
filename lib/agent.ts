import { agentTools } from "@codkit/agent-tools";
import { evmChain } from "@codkit/agent-tools/evm";
import { uniswapV3 } from "@codkit/agent-tools/uniswap";
import { getRpcUrl } from "@codkit/config";
import { providersFromEnv } from "@codkit/mcp/agent";
import { toAiSdkTools } from "@codkit/mcp/ai-sdk";
import { createPolicyEngine, toAtomic } from "@codkit/policy";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, isStepCount } from "ai";
import { createPublicClient, createWalletClient, type Hex, http, nonceManager } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const CHAIN = "eip155:84532";

/** The agent's wallet, its limits, and the four tools. Dry run is forced: the page can preview a swap, never send one. */
export function agentWallet() {
  const key = process.env.AGENT_PRIVATE_KEY as Hex | undefined;
  if (!key) throw new Error("set AGENT_PRIVATE_KEY (a Base Sepolia test key) in .env");
  const account = privateKeyToAccount(key, { nonceManager });
  const transport = http(getRpcUrl("base-sepolia"));
  const chain = evmChain({
    chain: "base-sepolia",
    // `as never` until @codkit/agent-tools > 0.1.0: 0.1.0's client types reject chain-specific viem clients (Base, OP)
    publicClient: createPublicClient({ chain: baseSepolia, transport }) as never,
    walletClient: createWalletClient({ account, chain: baseSepolia, transport }) as never,
    tokens: { USDC: { address: USDC, decimals: 6 } },
    swap: [uniswapV3()],
  });
  const engine = createPolicyEngine({
    policy: {
      chains: [CHAIN],
      limits: [
        { asset: "native", chain: CHAIN, label: "ETH", perTx: toAtomic("0.0005", 18) },
        { asset: USDC, chain: CHAIN, label: "USDC", perTx: toAtomic("0.5", 6) },
      ],
    },
  });
  const tools = agentTools({ engine, chains: [chain], maxPerCall: { ETH: "0.0005", USDC: "0.5" }, dryRun: true });
  return { account, engine, tools };
}

export interface Step {
  tool: string;
  ok: boolean;
  output: string;
}

export async function runAgent(prompt: string): Promise<{ text: string; steps: Step[]; model: string }> {
  const provider = providersFromEnv()[0];
  if (!provider) throw new Error("set an LLM key (GROQ_API_KEY, GEMINI_API_KEY, …) in .env");
  const { tools } = agentWallet();
  const steps: Step[] = [];
  const llm = createOpenAICompatible({ name: provider.name, baseURL: provider.baseUrl, ...(provider.apiKey && { apiKey: provider.apiKey }) });
  const { text } = await generateText({
    model: llm(provider.model),
    tools: toAiSdkTools(tools, { onResult: (e) => steps.push({ tool: e.name, ok: e.ok, output: e.output.slice(0, 600) }) }),
    stopWhen: isStepCount(8),
    system: "You are a careful on-chain agent on Base Sepolia (a testnet). Use the tools, never invent balances, and say plainly what happened, including refusals. Swaps are previews only.",
    prompt,
  });
  return { text, steps, model: `${provider.name}/${provider.model}` };
}
