import { defineChain } from "viem";

export const axonMainnet = defineChain({
  id: 8210,
  name: "Axon Mainnet",
  nativeCurrency: {
    name: "AXON",
    symbol: "AXON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet-rpc.axonchain.ai/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Axon Explorer",
      url: "https://explorer.axonchain.ai",
    },
  },
});
