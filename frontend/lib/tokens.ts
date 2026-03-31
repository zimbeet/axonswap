export interface Token {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

export const AXON_CHAIN_ID = 8210;

/** Native AXON uses a sentinel empty address */
export const NATIVE_AXON_ADDRESS = "" as const;

export function isNativeToken(token: Token): boolean {
  return token.symbol === "AXON" && token.address === NATIVE_AXON_ADDRESS;
}

export const NATIVE_AXON: Token = {
  chainId: AXON_CHAIN_ID,
  address: NATIVE_AXON_ADDRESS,
  name: "AXON",
  symbol: "AXON",
  decimals: 18,
};

export const WAXON: Token = {
  chainId: AXON_CHAIN_ID,
  address: process.env.NEXT_PUBLIC_WAXON_ADDRESS ?? "",
  name: "Wrapped AXON",
  symbol: "WAXON",
  decimals: 18,
};

export const COMMON_TOKENS = ["AXON", "WAXON", "USDC", "USDT"];

export const DEFAULT_TOKEN_LIST: Token[] = [
  {
    chainId: AXON_CHAIN_ID,
    address: NATIVE_AXON_ADDRESS,
    name: "AXON",
    symbol: "AXON",
    decimals: 18,
  },
  {
    chainId: AXON_CHAIN_ID,
    address: process.env.NEXT_PUBLIC_WAXON_ADDRESS ?? "",
    name: "Wrapped AXON",
    symbol: "WAXON",
    decimals: 18,
  },
  {
    chainId: AXON_CHAIN_ID,
    address: process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
  },
  {
    chainId: AXON_CHAIN_ID,
    address: process.env.NEXT_PUBLIC_USDT_ADDRESS ?? "",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
  },
  {
    chainId: AXON_CHAIN_ID,
    address: process.env.NEXT_PUBLIC_WBTC_ADDRESS ?? "",
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
  },
  {
    chainId: AXON_CHAIN_ID,
    address: process.env.NEXT_PUBLIC_WETH_ADDRESS ?? "",
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
  },
];
