export const FACTORY_ABI = [
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "fee", type: "uint24" },
    ],
    name: "createPool",
    outputs: [{ name: "pool", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "fee", type: "uint24" },
    ],
    name: "getPool",
    outputs: [{ name: "pool", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "fee", type: "uint24" }],
    name: "feeAmountTickSpacing",
    outputs: [{ name: "", type: "int24" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "fee", type: "uint24" },
      { name: "tickSpacing", type: "int24" },
    ],
    name: "enableFeeAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "newOwner", type: "address" }],
    name: "setOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "token0", type: "address" },
      { indexed: true, name: "token1", type: "address" },
      { indexed: true, name: "fee", type: "uint24" },
      { indexed: false, name: "tickSpacing", type: "int24" },
      { indexed: false, name: "pool", type: "address" },
    ],
    name: "PoolCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "oldOwner", type: "address" },
      { indexed: true, name: "newOwner", type: "address" },
    ],
    name: "OwnerChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "fee", type: "uint24" },
      { indexed: true, name: "tickSpacing", type: "int24" },
    ],
    name: "FeeAmountEnabled",
    type: "event",
  },
] as const;
