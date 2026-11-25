import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  // the x402 packages run on the server only
  serverExternalPackages: ["@x402/core", "@x402/evm", "@x402/fetch", "@x402/hono"],
};
export default config;
