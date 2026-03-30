export interface Token {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

export const AXON_CHAIN_ID = 8210;

export const WAXON: Token = {
  chainId: AXON_CHAIN_ID,
  address: "",
  name: "Wrapped AXON",
  symbol: "WAXON",
  decimals: 18,
};

export const DEFAULT_TOKEN_LIST: Token[] = [
  {
    chainId: AXON_CHAIN_ID,
    address: "",
    name: "AXON",
    symbol: "AXON",
    decimals: 18,
  },
  {
    chainId: AXON_CHAIN_ID,
    address: "",
    name: "Wrapped AXON",
    symbol: "WAXON",
    decimals: 18,
  },
  {
    chainId: AXON_CHAIN_ID,
    address: "",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
  },
  {
    chainId: AXON_CHAIN_ID,
    address: "",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
  },
];
