# Contributing to AxonSwap

Thank you for your interest in contributing to AxonSwap! This document explains how to set up your development environment and submit contributions.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Testing Requirements](#testing-requirements)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Commit Style](#commit-style)

---

## Development Setup

### Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Git**

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # Fill in contract addresses
npm run dev                  # http://localhost:3000
```

### Contracts

```bash
cd contracts
npm install
cp .env.example .env         # Fill in PRIVATE_KEY and AXON_RPC_URL
npx hardhat compile
npx hardhat test
```

### Root convenience scripts

From the repo root:

```bash
npm run dev               # Start frontend dev server
npm run build             # Build frontend
npm run lint              # Lint frontend
npm run contracts:compile # Compile contracts
npm run contracts:test    # Run contract tests
npm run contracts:deploy  # Deploy to Axonchain (requires .env)
```

---

## Project Structure

```
axonswap/
├── frontend/          # Next.js 15 app (TypeScript, Tailwind, wagmi v2)
│   ├── app/           # App Router pages
│   ├── components/    # React components
│   ├── hooks/         # wagmi/viem custom hooks
│   └── lib/           # ABIs, contracts config, utilities
└── contracts/         # Hardhat project (Uniswap V3 fork)
    ├── src/           # Solidity source files
    ├── scripts/       # Deploy / verify / seed scripts
    └── test/          # Hardhat tests (Mocha + Chai)
```

---

## Code Style

### Frontend (TypeScript / React)

- **Formatter**: [Prettier](frontend/.prettierrc) — run `npm run format` in `frontend/`
- **Linter**: ESLint with Next.js config — run `npm run lint` in `frontend/`
- Use **named exports** for components (not default export from barrel files).
- Mark pages/components as `"use client"` only when needed.
- Follow the existing **Axon dark design system** — use CSS variables from `styles/globals.css`.
- Prefer the existing UI primitives: `Button`, `Card`, `Modal`, `Input`, `Skeleton`.

### Contracts (Solidity)

- Solidity `0.7.6` for core/periphery (matches Uniswap V3).
- Solidity `0.8.20` for utility contracts (`WAXON`, `Multicall`).
- NatSpec comments on all public/external functions.
- Avoid floating pragma (`^`) — use pinned versions.

---

## Testing Requirements

All PRs must maintain or improve test coverage.

### Frontend

```bash
cd frontend
npm run lint    # Must pass with zero errors
npm run build   # Must produce a successful build
```

TypeScript errors are treated as build failures.

### Contracts

```bash
cd contracts
npx hardhat test    # All tests must pass
```

- Write tests for any new contract functionality.
- Tests live in `contracts/test/` and use **Mocha + Chai**.
- Test both happy paths and revert cases.

---

## Pull Request Guidelines

1. **Fork** the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make focused changes** — one feature or fix per PR.

3. **Run CI checks locally** before opening the PR:
   ```bash
   # Frontend
   cd frontend && npm run lint && npm run build
   # Contracts
   cd contracts && npx hardhat compile && npx hardhat test
   ```

4. **Update documentation** if your change affects user-facing behavior or contract interfaces.

5. **Open the PR** against `main` with a clear title and description:
   - What does this PR do?
   - Why is it needed?
   - Any breaking changes?

6. **CI must pass** (lint + build + contract tests) before merging.

---

## Commit Style

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Maintenance, dependency updates |
| `docs:` | Documentation only |
| `test:` | Adding or updating tests |
| `refactor:` | Refactoring without behavior change |
| `style:` | Formatting, no logic change |

Examples:
```
feat: add Pool.test.js with initialization and liquidity tests
fix: clamp slippage input to valid range in SettingsPanel
docs: update README with contract addresses
```

---

## Questions?

Open a [GitHub Discussion](https://github.com/zimbeet/axonswap/discussions) or create an issue tagged `question`.
