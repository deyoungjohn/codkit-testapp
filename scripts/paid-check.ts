/**
 * Pays the app's own x402 endpoint from the agent wallet, through the policy engine:
 *   pnpm dev            # in one terminal
 *   pnpm check:paid     # in another (needs AGENT_PRIVATE_KEY with a little Base Sepolia USDC)
 */
import { createBudgetedFetch, registerExactEvmScheme, x402Client } from "@codkit/pay";
import { createPolicyEngine, usdc } from "@codkit/policy";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const url = process.argv[2] ?? "http://localhost:3000/api/paid/price";
const key = process.env.AGENT_PRIVATE_KEY as Hex | undefined;
if (!key) throw new Error("set AGENT_PRIVATE_KEY in .env");

const unpaid = await fetch(url);
console.log(`unpaid request: HTTP ${unpaid.status} (expected 402)`);
if (unpaid.status !== 402) process.exit(1);

const engine = createPolicyEngine({ policy: { chains: ["eip155:84532"], limits: [{ asset: USDC, perTx: usdc("0.01"), perPeriod: { amount: usdc("0.05"), seconds: 3600 } }] } });
const client = new x402Client();
registerExactEvmScheme(client, { signer: privateKeyToAccount(key) });
const pay = createBudgetedFetch({ engine, client, onPayment: (o) => console.log(`payment: ${o.status}`) });
const res = await pay(url);
console.log(`paid request: HTTP ${res.status}`, await res.json());
process.exit(res.ok ? 0 : 1);
