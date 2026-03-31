import { ERC20_ABI } from "./abis/erc20";
import { FACTORY_ABI } from "./abis/factory";
import { ROUTER_ABI } from "./abis/router";
import { QUOTER_V2_ABI, QUOTER_ABI } from "./abis/quoter";
import { POSITION_MANAGER_ABI } from "./abis/position-manager";
import { POOL_ABI } from "./abis/pool";

// Re-export ABIs for convenience
export {
  ERC20_ABI,
  FACTORY_ABI,
  ROUTER_ABI,
  QUOTER_ABI,
  QUOTER_V2_ABI,
  POSITION_MANAGER_ABI,
  POOL_ABI,
};

// Backwards-compat aliases used by existing swap components
export const SWAP_ROUTER_ABI = ROUTER_ABI;

export const WAXON_ABI = [
  { inputs: [], name: "deposit", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ name: "wad", type: "uint256" }], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "owner", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

/**
 * Contract addresses — populated from environment variables after deployment.
 * Set NEXT_PUBLIC_* variables (see frontend/.env.example) to activate on-chain features.
 */
export const CONTRACT_ADDRESSES = {
  WAXON: (process.env.NEXT_PUBLIC_WAXON_ADDRESS ?? "") as `0x${string}`,
  FACTORY: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "") as `0x${string}`,
  SWAP_ROUTER: (process.env.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS ?? "") as `0x${string}`,
  POSITION_MANAGER: (process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS ?? "") as `0x${string}`,
  QUOTER: (process.env.NEXT_PUBLIC_QUOTER_ADDRESS ?? "") as `0x${string}`,
  QUOTER_V2: (process.env.NEXT_PUBLIC_QUOTER_V2_ADDRESS ?? "") as `0x${string}`,
  TICK_LENS: (process.env.NEXT_PUBLIC_TICK_LENS_ADDRESS ?? "") as `0x${string}`,
  MULTICALL: (process.env.NEXT_PUBLIC_MULTICALL_ADDRESS ?? "") as `0x${string}`,
};
