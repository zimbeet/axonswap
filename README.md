# AxonSwap ⚡

> The native decentralized exchange (DEX) on [Axonchain](https://axonchain.ai) — a concentrated liquidity AMM forked from Uniswap V3.

[![CI](https://github.com/zimbeet/axonswap/actions/workflows/ci.yml/badge.svg)](https://github.com/zimbeet/axonswap/actions/workflows/ci.yml)

---

## Project Architecture

```
axonswap/
├── frontend/                 # Next.js 15 app (App Router, TypeScript, Tailwind CSS)
│   ├── app/
│   │   ├── swap/page.tsx     # Token swap interface
│   │   ├── pool/page.tsx     # Pool list & My Positions
│   │   ├── add/page.tsx      # Add liquidity
│   │   └── remove/page.tsx   # Remove liquidity
│   ├── components/
│   │   ├── ui/               # Button, Card, Modal, Input, Skeleton, ToastContainer
│   │   ├── layout/           # Navbar, Footer
│   │   ├── swap/             # TokenSelectorModal, SettingsPanel, ConfirmSwapModal, TransactionHistory
│   │   ├── pool/             # PoolCard, PositionCard
│   │   └── liquidity/        # FeeSelector, PriceRangeInput, LiquidityPreview, PercentageSlider
│   ├── hooks/                # useSwap, useTokenApproval, useSwapExecution, usePoolList,
│   │                         # usePositions, useLiquidity, usePriceRange, useToast,
│   │                         # useTransactionHistory, useTokenBalance, useDebounce
│   └── lib/
│       ├── axonchain.ts      # Wagmi chain definition (Chain ID 8210)
│       ├── contracts.ts      # Contract addresses + re-exported ABIs
│       ├── tokens.ts         # Token list
│       ├── utils.ts          # Helpers
│       └── abis/             # factory, pool, router, position-manager, quoter, erc20
│
└── contracts/                # Hardhat project — Uniswap V3 fork
    ├── src/
    │   ├── core/             # AxonSwapFactory, AxonSwapPool, AxonSwapPoolDeployer
    │   ├── periphery/        # SwapRouter, NonfungiblePositionManager, Quoter, QuoterV2, TickLens
    │   ├── tokens/           # WAXON (Wrapped AXON), Multicall
    │   ├── libraries/        # TickMath, SqrtPriceMath, FullMath, Oracle, …
    │   └── interfaces/       # All Solidity interfaces
    ├── scripts/
    │   └── deploy.js         # Full deployment script
    └── test/                 # WAXON, Factory, Router tests
```

---

## Chain Info

| Property    | Value                                  |
|-------------|----------------------------------------|
| Chain ID    | `8210`                                 |
| RPC         | `https://mainnet-rpc.axonchain.ai/`    |
| Explorer    | `https://explorer.axonchain.ai`        |
| Native coin | `AXON` (18 decimals)                   |

---

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Frontend

```bash
cd frontend
npm install

# Copy env template and fill in deployed contract addresses
cp .env.example .env.local

npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
```

### Contracts

```bash
cd contracts
npm install

# Compile
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Axon Mainnet (requires funded deployer key)
cp .env.example .env
# Edit .env: set PRIVATE_KEY and AXON_RPC_URL
npx hardhat run scripts/deploy.js --network axon
```

After deployment, copy the generated `contracts/deployed-addresses.json` addresses into `frontend/.env.local`.

---

## Environment Variables

Create `frontend/.env.local` (copy from `frontend/.env.example`):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_WAXON_ADDRESS` | Deployed WAXON contract |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | AxonSwapFactory |
| `NEXT_PUBLIC_SWAP_ROUTER_ADDRESS` | SwapRouter |
| `NEXT_PUBLIC_POSITION_MANAGER_ADDRESS` | NonfungiblePositionManager |
| `NEXT_PUBLIC_QUOTER_ADDRESS` | Quoter |
| `NEXT_PUBLIC_QUOTER_V2_ADDRESS` | QuoterV2 |
| `NEXT_PUBLIC_TICK_LENS_ADDRESS` | TickLens |
| `NEXT_PUBLIC_MULTICALL_ADDRESS` | Multicall |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC token |
| `NEXT_PUBLIC_USDT_ADDRESS` | USDT token |
| `NEXT_PUBLIC_WBTC_ADDRESS` | WBTC token |
| `NEXT_PUBLIC_WETH_ADDRESS` | WETH token |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID (optional) |

---

## Deployment

### Vercel (Frontend)

1. Import the `axonswap` GitHub repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add all `NEXT_PUBLIC_*` environment variables.
4. Deploy — the `frontend/vercel.json` config handles the rest.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-feature`.
3. Commit your changes (Conventional Commits style: `feat:`, `fix:`, `chore:`).
4. Open a Pull Request against `main`.
5. CI must pass (lint + build + contract tests) before merging.

---

## License

MIT
