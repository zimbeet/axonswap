# ⚡ AxonSwap

> The native decentralized exchange on **Axonchain** — Uniswap V3 concentrated liquidity AMM for AI Agents.

![Chain](https://img.shields.io/badge/Chain-Axon%20Mainnet-36B1FF)
![Chain ID](https://img.shields.io/badge/Chain%20ID-8210-6A75FF)
![License](https://img.shields.io/badge/License-GPL--2.0--or--later-green)

---

## Architecture

```
┌─────────────────┐     RPC (Chain ID: 8210)     ┌─────────────────┐
│   Next.js 14    │ ──────────────────────────▶   │   Axonchain     │
│   Frontend      │     wagmi + viem              │   Smart         │
│   (TypeScript)  │ ◀──────────────────────────   │   Contracts     │
└─────────────────┘                               └─────────────────┘
        │                                                 │
  RainbowKit Wallet                                 Solidity 0.7.6
  Tailwind CSS                                      + 0.8.20
  Dark Sci-Fi Theme                                 Hardhat
```

**Zero backend** — all DEX logic lives on-chain; the frontend interacts directly via RPC.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14+ (App Router) | SSR, routing |
| **Styling** | Tailwind CSS v3 | Axon dark sci-fi theme |
| **Chain** | wagmi v2 + viem | EVM interaction |
| **Wallet** | RainbowKit | Wallet connection UI |
| **Contracts** | Solidity 0.7.6 / 0.8.20 | Core AMM, Router, NFT Positions |
| **Dev Tools** | Hardhat | Compile, test, deploy |

---

## Chain Configuration

| Parameter | Value |
|-----------|-------|
| **Chain Name** | Axon Mainnet |
| **Chain ID** | `8210` |
| **RPC URL** | `https://mainnet-rpc.axonchain.ai/` |
| **Native Token** | AXON (18 decimals) |
| **Explorer** | `https://explorer.axonchain.ai` |
| **Wrapped Token** | WAXON |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/zimbeet/axonswap.git
cd axonswap
```

### 2. Smart Contracts

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

### 3. Deploy (Axon Mainnet)

```bash
cp .env.example .env
# Edit .env with your deployer private key
npx hardhat run scripts/deploy.js --network axon
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the Swap page.

---

## Contract Addresses

> Addresses will be populated after deployment.

| Contract | Address |
|----------|---------|
| WAXON | `TBD` |
| AxonSwapFactory | `TBD` |
| SwapRouter | `TBD` |
| NonfungiblePositionManager | `TBD` |
| Quoter | `TBD` |
| QuoterV2 | `TBD` |
| TickLens | `TBD` |
| Multicall | `TBD` |

---

## Directory Structure

```
axonswap/
├── README.md
├── .gitignore
├── frontend/                           # Next.js 14+ Frontend
│   ├── app/
│   │   ├── layout.tsx                  # Root layout with providers
│   │   ├── page.tsx                    # Redirects to /swap
│   │   ├── providers.tsx               # WagmiProvider + RainbowKit
│   │   ├── swap/page.tsx               # Swap page
│   │   ├── pool/page.tsx               # Pool list
│   │   └── add/page.tsx                # Add liquidity
│   ├── components/
│   │   ├── ui/                         # Button, Card, Modal, Input
│   │   ├── layout/                     # Navbar, Footer
│   │   └── wallet/                     # ConnectButton
│   ├── lib/
│   │   ├── axonchain.ts                # Chain definition (ID: 8210)
│   │   ├── contracts.ts                # ABIs & addresses
│   │   └── tokens.ts                   # Default token list
│   ├── styles/globals.css              # Tailwind + Axon CSS variables
│   ├── tailwind.config.ts
│   └── package.json
├── contracts/                          # Solidity Smart Contracts
│   ├── core/
│   │   ├── AxonSwapFactory.sol         # Pool factory (CREATE2)
│   │   ├── AxonSwapPool.sol            # Concentrated liquidity AMM
│   │   ├── AxonSwapPoolDeployer.sol    # Pool deployer
│   │   └── interfaces/                 # 9 interface files
│   ├── periphery/
│   │   ├── SwapRouter.sol              # Single & multi-hop swaps
│   │   ├── NonfungiblePositionManager.sol  # ERC-721 positions
│   │   ├── Quoter.sol                  # On-chain price quotes
│   │   ├── QuoterV2.sol                # Enhanced quotes
│   │   ├── TickLens.sol                # Tick data reader
│   │   └── interfaces/                 # 4 interface files
│   ├── tokens/
│   │   ├── WAXON.sol                   # Wrapped AXON (ERC-20)
│   │   └── Multicall.sol               # Batch calls
│   ├── libraries/                      # 16 math/utility libraries
│   │   ├── TickMath.sol
│   │   ├── SqrtPriceMath.sol
│   │   ├── FullMath.sol
│   │   ├── SwapMath.sol
│   │   └── ...
│   ├── test/                           # Hardhat tests
│   ├── scripts/deploy.js               # Deployment script
│   ├── hardhat.config.js
│   └── package.json
```

---

## Smart Contracts Overview

### Core (Solidity 0.7.6)

- **AxonSwapFactory** — Creates and registers liquidity pools via CREATE2. Default fee tiers: 0.05% (500), 0.3% (3000), 1% (10000).
- **AxonSwapPool** — Full concentrated liquidity AMM with mint/burn/swap/flash/observe functions and TWAP oracle.
- **AxonSwapPoolDeployer** — Deploys pools with deterministic addresses.

### Periphery (Solidity 0.7.6)

- **SwapRouter** — exactInputSingle, exactInput (multi-hop), exactOutputSingle, exactOutput with deadline and slippage protection.
- **NonfungiblePositionManager** — ERC-721 based position management: mint, increaseLiquidity, decreaseLiquidity, collect, burn.
- **Quoter / QuoterV2** — On-chain price quotation using try/catch revert pattern.
- **TickLens** — Batch read tick data for UI display.

### Tokens (Solidity 0.8.20)

- **WAXON** — Wrapped AXON following WETH9 pattern.
- **Multicall** — Batch multiple contract calls into one transaction.

### Libraries

TickMath, SqrtPriceMath, FullMath, SwapMath, LiquidityMath, LiquidityAmounts, Oracle, Position, Tick, TickBitmap, BitMath, FixedPoint96, FixedPoint128, SafeCast, UnsafeMath, TransferHelper.

---

## Frontend Pages

- **`/swap`** — Token swap interface with from/to inputs, direction flip, price display, slippage tolerance.
- **`/pool`** — Pool list table with TVL/volume/APR + My Positions section.
- **`/add`** — 4-step add liquidity: pair selection → fee tier → price range → deposit amounts.

---

## Fee Tiers

| Fee | Tick Spacing | Best For |
|-----|-------------|----------|
| 0.05% (500) | 10 | Stable pairs |
| 0.3% (3000) | 60 | Most pairs |
| 1% (10000) | 200 | Exotic pairs |

---

## License

GPL-2.0-or-later
