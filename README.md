# AxonSwap ⚡

> The native decentralized exchange (DEX) on [Axonchain](https://axonchain.ai) — a concentrated liquidity AMM forked from Uniswap V3.

[![CI](https://github.com/zimbeet/axonswap/actions/workflows/ci.yml/badge.svg)](https://github.com/zimbeet/axonswap/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.7.6-gray?logo=solidity)](https://soliditylang.org)

---

## Project Architecture

```
axonswap/
├── frontend/                 # Next.js 15 app (App Router, TypeScript, Tailwind CSS)
│   ├── app/
│   │   ├── page.tsx          # Landing page (Hero, Features, Stats)
│   │   ├── swap/page.tsx     # Token swap interface
│   │   ├── pool/page.tsx     # Pool list & My Positions
│   │   ├── add/page.tsx      # Add liquidity
│   │   ├── remove/page.tsx   # Remove liquidity
│   │   ├── not-found.tsx     # Custom 404
│   │   ├── error.tsx         # Error boundary
│   │   └── loading.tsx       # Global loading state
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
    │   ├── deploy.js         # Full deployment script (saves to deployments/axon-mainnet.json)
    │   ├── verify.js         # Contract verification commands
    │   └── seed-pools.js     # Initial pool creation (WAXON/USDC, WAXON/USDT)
    ├── deployments/          # Generated deployment artifacts
    └── test/                 # WAXON, Factory, Pool, Router tests
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

## Contract Addresses

> Contracts are not yet deployed. Addresses will be populated after mainnet deployment.

| Contract | Address |
|---|---|
| WAXON | *(pending deployment)* |
| AxonSwapFactory | *(pending deployment)* |
| SwapRouter | *(pending deployment)* |
| NonfungiblePositionManager | *(pending deployment)* |
| Quoter | *(pending deployment)* |
| QuoterV2 | *(pending deployment)* |
| TickLens | *(pending deployment)* |
| Multicall | *(pending deployment)* |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/zimbeet/axonswap.git
cd axonswap

# Install all dependencies
cd frontend && npm install
cd ../contracts && npm install

# Start the frontend
cd ../frontend && npm run dev   # http://localhost:3000
```

Or use the root convenience scripts:

```bash
npm run dev                 # Start frontend dev server
npm run build               # Build frontend for production
npm run contracts:compile   # Compile contracts
npm run contracts:test      # Run contract tests
```

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

# Verify contracts
node scripts/verify.js

# Seed initial pools (after deployment)
npx hardhat run scripts/seed-pools.js --network axon
```

After deployment, copy the generated `contracts/deployments/axon-mainnet.json` addresses into `frontend/.env.local`.

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

### Contracts (Axonchain Mainnet)

```bash
cd contracts
cp .env.example .env   # Set PRIVATE_KEY + AXON_RPC_URL
npx hardhat run scripts/deploy.js --network axon
node scripts/verify.js  # Print verification commands
```

---

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) — How to contribute
- [SECURITY.md](SECURITY.md) — Security policy and bug reporting
- [LICENSE](LICENSE) — MIT License

---

## License

MIT — see [LICENSE](LICENSE).
