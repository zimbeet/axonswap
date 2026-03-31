# Security Policy

## Overview

AxonSwap is a concentrated liquidity automated market maker (AMM) built on Axonchain. It is a fork of Uniswap V3 adapted for the Axon ecosystem.

## Audit Status

> ⚠️ **AxonSwap smart contracts have NOT been formally audited.**
>
> Use at your own risk. Do not deposit funds you cannot afford to lose.

We are actively working to engage a reputable auditing firm. Audit results will be published in this repository when available.

## Known Risks

As a Uniswap V3 fork, AxonSwap inherits the following well-documented risks:

1. **Impermanent loss** — Liquidity providers may experience losses relative to holding tokens when prices diverge.
2. **Price manipulation** — Low-liquidity pools are susceptible to flash loan attacks and sandwich attacks.
3. **Smart contract bugs** — Despite extensive testing, undiscovered vulnerabilities may exist.
4. **Reentrancy** — The pool uses a mutex (`unlocked` flag in `slot0`) to prevent reentrancy, consistent with Uniswap V3.
5. **Oracle manipulation** — The TWAP oracle is a lagging indicator and should not be used as a sole price source for critical operations.
6. **Tick overflow** — Ticks outside valid ranges (`MIN_TICK` / `MAX_TICK`) are blocked by the contracts, but integrators must validate inputs.
7. **Operator risk** — The Factory `owner` can enable new fee tiers. The owner key must be secured.

## Security Considerations for Integrators

- Always validate token addresses before passing them to the router.
- Use slippage protection (`amountOutMinimum`) for all swaps.
- Set reasonable deadlines on transactions.
- Do not rely solely on on-chain quotes for large trades — use off-chain simulation.
- Be aware of token decimals when computing `sqrtPriceX96` for pool initialization.

## Bug Bounty

> 🚧 A formal bug bounty program is not yet established.

If you discover a critical vulnerability, please disclose it responsibly by contacting the team privately before any public disclosure. See contact information below.

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

To report a security issue privately:

1. Email: **security@axonswap.fi** *(placeholder — update before launch)*
2. Include a detailed description of the vulnerability, steps to reproduce, and potential impact.
3. We will acknowledge receipt within 48 hours and work toward a fix and coordinated disclosure.

## Scope

The following contracts are in scope:

| Contract | File |
|---|---|
| AxonSwapFactory | `contracts/src/core/AxonSwapFactory.sol` |
| AxonSwapPool | `contracts/src/core/AxonSwapPool.sol` |
| AxonSwapPoolDeployer | `contracts/src/core/AxonSwapPoolDeployer.sol` |
| SwapRouter | `contracts/src/periphery/SwapRouter.sol` |
| NonfungiblePositionManager | `contracts/src/periphery/NonfungiblePositionManager.sol` |
| Quoter | `contracts/src/periphery/lens/Quoter.sol` |
| QuoterV2 | `contracts/src/periphery/lens/QuoterV2.sol` |
| WAXON | `contracts/src/tokens/WAXON.sol` |

The frontend (`frontend/`) is out of scope for the smart contract bug bounty.
