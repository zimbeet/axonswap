# AxonSwap — Uniswap V3 Fork 多链 DEX

> 项目实现文档（最终版） | 最后更新: 2026-04-08

---

## 📋 项目概览

| 属性 | 值 |
|------|------|
| 项目名称 | **AxonSwap** |
| 协议基础 | Uniswap V3 (集中流动性 AMM) |
| 当前链 | BSC Testnet (Chain ID: 97) |
| 前端框架 | 自定义轻量前端 (axonswap-web/) — 非 Uniswap monorepo |
| 主题风格 | 黑白双色系（暗色/亮色模式切换） |
| 数据索引 | RPC 直接查询（无 Subgraph） |

> **关于前端选型**: 最初尝试 Fork Uniswap interface monorepo，但由于 Windows 下 symlink 和依赖问题无法编译。最终自建轻量前端（React 18 + Vite + wagmi v2），功能完全覆盖 Swap / Pool / Add-Remove Liquidity / Position Detail。

---

## 📂 实际项目目录结构

```
d:\AXON\axonswap\
├── CLAUDE.md                           # 本文件
├── axonswap-web/                       # ✅ 自建前端（正在使用）
│   ├── src/
│   │   ├── abi/                        # 合约 ABI 定义
│   │   │   ├── ERC20.ts               # approve, allowance, balanceOf, decimals, symbol, name
│   │   │   ├── V3Core.ts              # FACTORY_ABI, POOL_ABI, WETH_ABI (deposit/withdraw)
│   │   │   ├── SwapRouter.ts          # exactInputSingle, unwrapWETH9, multicall, refundETH
│   │   │   ├── QuoterV2.ts            # quoteExactInputSingle, quoteExactOutputSingle
│   │   │   └── PositionManager.ts     # mint, increaseLiquidity, decreaseLiquidity, collect, multicall, unwrapWETH9, sweepToken, refundETH
│   │   ├── components/
│   │   │   ├── Header.tsx             # Logo + 导航 (Swap/Pool/Tokens) + 主题切换 + RainbowKit ConnectButton
│   │   │   ├── Footer.tsx             # 社交链接 + 版权
│   │   │   └── TokenSelector.tsx      # 代币选择弹窗 (搜索/余额/图标)
│   │   ├── config/
│   │   │   ├── contracts.ts           # 🔑 合约地址 + LEGACY_POSITION_MANAGERS + POOL_INIT_CODE_HASH + FEE_TIERS
│   │   │   ├── tokens.ts             # 🔑 Token 接口 + NATIVE_TOKEN + 所有代币定义 + DEFAULT_TOKENS 数组
│   │   │   ├── chains.ts             # 🔑 viem defineChain() 链定义
│   │   │   ├── wagmi.ts              # RainbowKit + 钱包配置
│   │   │   └── index.ts              # 统一导出
│   │   ├── hooks/
│   │   │   ├── useQuote.ts           # QuoterV2 报价 (尝试 4 个费率层级取最优)
│   │   │   └── useTokenBalance.ts    # 原生/ERC20 余额查询 + 格式化
│   │   ├── pages/
│   │   │   ├── SwapPage.tsx          # 代币兑换 + WBNB↔tBNB wrap/unwrap
│   │   │   ├── PoolPage.tsx          # LP 仓位列表 (新+旧 PM)
│   │   │   ├── AddLiquidityPage.tsx  # 新建流动性仓位
│   │   │   ├── PositionDetailPage.tsx # 仓位详情 + 追加/移除流动性
│   │   │   └── TokensPage.tsx        # 代币列表信息
│   │   ├── store/
│   │   │   ├── theme.ts              # 主题状态 (isDark, toggle) — 持久化
│   │   │   └── swap.ts               # Swap 参数 (slippage/deadline/expertMode/multihop) — 持久化
│   │   ├── App.tsx                    # 路由 + Provider 组装
│   │   ├── main.tsx                   # React 18 入口
│   │   └── index.css                  # CSS 变量 (暗/亮色主题)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── contracts/                          # 智能合约
│   ├── v3-core/                        # Fork Uniswap/v3-core (Solidity 0.7.6)
│   ├── v3-periphery/                   # Fork Uniswap/v3-periphery (Solidity 0.7.6)
│   ├── v3-staker/                      # Fork Uniswap/v3-staker
│   └── project/                        # ✅ Hardhat 项目 (编译/部署)
│       ├── contracts/
│       │   ├── Multicall2.sol          # 批量调用合约
│       │   └── tokens/
│       │       ├── WBNB.sol            # WETH9 标准 (deposit/withdraw)
│       │       ├── AxonToken.sol       # 治理代币 ERC20 (100M supply)
│       │       └── MockERC20.sol       # 模拟代币 (可配置 decimals)
│       ├── scripts/
│       │   ├── deploy.js              # 🔑 主部署脚本 (断点续传, 17个合约)
│       │   ├── seed-and-distribute.js # 创建初始交易池
│       │   ├── add-seed-liquidity.js  # 添加初始流动性
│       │   ├── seed-pools.js          # 池子初始化
│       │   └── redeploy-nft-branding.js # NFT 名称品牌化重部署
│       ├── deployments/
│       │   ├── bscTestnet.json        # ✅ BSC Testnet 部署结果
│       │   └── hardhat.json           # 本地测试网部署结果
│       ├── hardhat.config.ts
│       ├── package.json
│       └── .env                        # 部署者私钥 + RPC URL
└── frontend/                           # ❌ Uniswap interface clone (未使用, 编译失败)
```

---

## ⛓️ 已部署链: BSC Testnet (Chain ID: 97)

### 链配置

| 属性 | 值 |
|------|------|
| Chain ID | 97 |
| 名称 | BSC Testnet |
| 原生币 | tBNB (18 decimals) |
| RPC (主) | `https://bsc-testnet-rpc.publicnode.com` |
| RPC (备) | `https://data-seed-prebsc-1-s1.binance.org:8545/` |
| 浏览器 | `https://testnet.bscscan.com` |
| 水龙头 | `https://www.bnbchain.org/en/testnet-faucet` |

### 部署者

| 属性 | 值 |
|------|------|
| 地址 | `0xe730736dA685435FbC169C5363cb5F4e58f361aF` |
| Gas Price | 5 gwei |

### 已部署合约地址

| 合约 | 地址 | 说明 |
|------|------|------|
| **WBNB** | `0x83b6D2526FE323cf82Faf4Cd10A6781e222d1c23` | WETH9 标准 |
| **Factory** | `0x10B7422fE11A24373277be76d1E41571B076cb01` | V3 工厂 |
| **SwapRouter** | `0xd7bF1Eba3eAA0b7227952A8e889a2F936F98Fc5D` | 交换路由 |
| **PositionManager** | `0xA9a430f2954f3B399fFf15bdE7645e6d2C7231cE` | NFT (name: "AxonSwap V3 Positions NFT-V1") |
| **Quoter** | `0x409875E9AB2d79963C35b4AabDD10c75921CBAAF` | 报价合约 v1 |
| **QuoterV2** | `0xF109aD22945DFe14A75CA25CaAfed8A34B6613E6` | 报价合约 v2 (前端使用) |
| **Multicall2** | `0xC1E4fAf7E3F8e0d97251f566C6ffC53c08028868` | 批量调用 |
| **TickLens** | `0x35012b1fb420D8c26D62b5A2b296Bc05135A80dF` | Tick 查询 |
| **NFTDescriptor** | `0xEFab4000dff44700CFCe9900535d24eE07316451` | NFT 描述库 |
| **NFTPositionDescriptor** | `0xCaeC072fFDDD168e55d500eC62683E84Fb21FFeA` | NFT 描述合约 |
| **InterfaceMulticall** | `0x57b7Cf2CF3Ed7A4a863a7CBf40f94CA0a350A373` | 接口 Multicall |
| **AxonToken** | `0x24483358c813aD89278f31CDA78f3Bc808d2bBDB` | 治理代币 (18 dec, 100M) |
| **mUSDC** | `0xBC14783680A73Ea119dcBCF59653dD4100a37efF` | Mock USDC (6 dec) |
| **mUSDT** | `0xFF24C8F61e412Ad86b5FfA66DC10F0d3f79670cc` | Mock USDT (6 dec) |
| **mWBTC** | `0x7ec1a956ccf76eFa8ab97C6E2D656B72F78A71bE` | Mock WBTC (8 dec) |
| **mWETH** | `0xC717e1eE0D32239420CEB5DfE7da91Ae32C2E00B` | Mock WETH (18 dec) |

**Legacy PositionManager** (品牌化之前部署, 仍有旧仓位):
- `0xC56F2DBB19638031232b4E00A925d6a8b1AE7B3e` (name: "Uniswap V3 Positions NFT-V1")

**POOL_INIT_CODE_HASH**: `0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54`

### 已初始化交易池

| 交易对 | 费率 | 池地址 |
|--------|------|--------|
| WBNB / mUSDC | 0.30% | `0xc356Ab685F214c3FBB55aE9304FFbC287867dFF9` |
| mUSDC / mUSDT | 0.05% | `0x05D87542Db4d3285a01ab05b9e0d45818D9e64fF` |
| WBNB / AXON | 0.30% | `0xCCeCf4D471a946C98f460A48330C16F6F33d507f` |

---

## 🎨 UI/UX 设计系统

### CSS 变量定义 (index.css)

```css
/* 暗色模式 (默认 :root) */
--bg-primary:     #0D0D0D;     /* 页面背景 */
--bg-secondary:   #1A1A1A;     /* 卡片背景 */
--bg-tertiary:    #2A2A2A;     /* 输入框/按钮底色 */
--text-primary:   #FFFFFF;     /* 主文字 */
--text-secondary: #999999;     /* 次要文字 */
--accent:         #FFFFFF;     /* 强调色 (按钮/链接) */
--border:         #333333;     /* 边框 */
--success:        #00FF88;     /* 成功 */
--error:          #FF4444;     /* 错误 */

/* 亮色模式 (.light 类) */
--bg-primary:     #FFFFFF;
--bg-secondary:   #F5F5F5;
--bg-tertiary:    #EBEBEB;
--text-primary:   #0D0D0D;
--text-secondary: #666666;
--accent:         #0D0D0D;
--border:         #E0E0E0;
--success:        #00CC66;
--error:          #CC3333;
```

### 主题切换
- `useThemeStore` (Zustand, 持久化为 `axonswap-theme`)
- 切换时在 `document.documentElement` 上添加/移除 `.light` 类
- RainbowKit 跟随切换: `darkTheme()` / `lightTheme()`

---

## 🖥️ 前端技术栈 (axonswap-web/)

### 依赖版本

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.28.0",
  "wagmi": "^2.14.0",
  "viem": "^2.21.0",
  "@rainbow-me/rainbowkit": "^2.2.0",
  "@tanstack/react-query": "^5.60.0",
  "ethers": "^5.7.2",
  "zustand": "^4.5.5",
  "tailwindcss": "^3.4.15",
  "vite": "^6.0.0",
  "typescript": "~5.6.2",
  "lucide-react": "^0.460.0",
  "framer-motion": "^11.11.0"
}
```

### 路由

| 路径 | 页面组件 | 功能 |
|------|----------|------|
| `/` | → `/swap` redirect | - |
| `/swap` | SwapPage | 代币兑换 + WBNB↔tBNB wrap/unwrap |
| `/pool` | PoolPage | LP 仓位列表 (新+旧 PM) |
| `/pool/add` | AddLiquidityPage | 创建新流动性仓位 |
| `/pool/position?id=X&pm=0x...` | PositionDetailPage | 仓位详情 + 追加/移除流动性 |
| `/tokens` | TokensPage | 代币列表信息 |

### 状态管理 (Zustand)

**themeStore** (`axonswap-theme` 持久化):
```typescript
{ isDark: boolean, toggle: () => void }
```

**swapStore** (`axonswap-swap` 部分持久化):
```typescript
{
  tokenIn: Token,        // 默认: NATIVE_TOKEN (tBNB)
  tokenOut: Token,       // 默认: mUSDC
  amountIn: string,
  amountOut: string,
  slippage: number,      // 默认: 0.5%
  deadline: number,      // 默认: 30 分钟
  expertMode: boolean,
  multihop: boolean,
  autoRouter: boolean,
  switchTokens(): void,
}
```

### 核心业务逻辑

#### Swap 流程
1. 用户输入 tokenIn + amountIn
2. `useQuote` 向 QuoterV2 查询 4 个费率 (0.30% → 0.05% → 1.00% → 0.01%) 取最优
3. **特殊**: WBNB↔tBNB 直接走 WETH9 的 deposit()/withdraw()，不走 Pool
4. ERC20 输入先 approve SwapRouter
5. 调用 SwapRouter.exactInputSingle()
6. **输出为原生币**: multicall([exactInputSingle, unwrapWETH9(0, recipient)])

#### 添加流动性流程
1. 选择代币对 + 费率层级
2. 从 Factory.getPool() 获取池子，读 slot0 得 sqrtPriceX96
3. 计算 tick range (全范围: MIN_TICK ~ MAX_TICK，按 tickSpacing 对齐)
4. 输入一侧金额 → 自动计算另一侧
5. approve 两个代币 → PositionManager.mint()
6. **有原生币时**: multicall([mint, refundETH])

#### 追加流动性 (Increase Liquidity)
1. 从 PositionDetailPage 点 "Increase Liquidity"
2. 使用 `PositionManager.increaseLiquidity({ tokenId, amount0Desired, amount1Desired, ... })`
3. **不创建新 NFT**，流动性追加到已有 tokenId
4. **有原生币时**: multicall([increaseLiquidity, refundETH])

#### 移除流动性流程
1. 选择百分比 (25%/50%/75%/100%)
2. multicall 组合:
   - `decreaseLiquidity(tokenId, liquidity, amount0Min, amount1Min, deadline)`
   - `collect(tokenId, recipient, MAX_UINT128, MAX_UINT128)`
   - 如果接收 tBNB: `unwrapWETH9(0, recipient)` + `sweepToken(otherToken, 0, recipient)`

#### 原生币 (tBNB) ↔ 包装币 (WBNB) 处理
- 前端使用占位地址 `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` 表示原生 tBNB
- UI 提供 "Add as tBNB"/"Receive as tBNB" 切换开关
- 合约层始终使用 WBNB，通过 multicall 中的 refundETH / unwrapWETH9 实现转换
- Swap 页面: WBNB↔tBNB 走 1:1 wrap/unwrap (不走池子)

### Legacy PositionManager 处理
- PoolPage 同时扫描新旧两个 PM 的仓位: `LEGACY_POSITION_MANAGERS` 数组
- 旧仓位标记 "Legacy" 标签
- PositionDetailPage 通过 URL 参数 `?pm=0x...` 区分操作哪个 PM
- 旧 PM 的 NFT name() 返回 "Uniswap V3..."（链上不可变）

---

## ⚙️ 智能合约构建配置

### Hardhat 配置 (contracts/project/hardhat.config.ts)

```typescript
{
  solidity: {
    compilers: [
      { version: "0.7.6", settings: { evmVersion: "istanbul", optimizer: { runs: 800 } } },
      { version: "0.8.20", settings: { evmVersion: "paris", optimizer: { runs: 200 } } },
    ],
  },
  networks: {
    bscTestnet: {
      url: "https://bsc-testnet-rpc.publicnode.com",
      chainId: 97,
      gasPrice: 5_000_000_000, // 5 gwei
      timeout: 120_000,
    },
  },
}
```

### 编译器版本说明
- **0.7.6 (istanbul)**: v3-core (Factory, Pool) + v3-periphery (SwapRouter, PositionManager, Quoter 等)
- **0.8.20 (paris)**: 自定义合约 (WBNB, AxonToken, MockERC20, Multicall2)
- **关键**: BSC 不支持 PUSH0 操作码，必须用 istanbul 或 paris，不能用 shanghai+

### 合约依赖

```json
{
  "@openzeppelin/contracts": "4.9.3",
  "@uniswap/v3-core": "file:../v3-core",
  "@uniswap/v3-periphery": "file:../v3-periphery",
  "hardhat": "^2.22.0",
  "@nomiclabs/hardhat-ethers": "^2.2.3",
  "@nomiclabs/hardhat-waffle": "^2.0.6",
  "ethers": "^5.7.2"
}
```

### 部署脚本 (scripts/deploy.js)
- 支持断点续传: 从 `deployments/{network}.json` 读取已部署地址，跳过已完成的步骤
- 合约品牌化: NonfungiblePositionManager 构造函数传入 "AxonSwap V3 Positions NFT-V1" / "AXON-V3-POS"
- NFTDescriptor 作为 library 链接到 NFTPositionDescriptor

### 部署命令

```bash
# 切换 Node
fnm env | Invoke-Expression; fnm use 22.13.1

# 编译
cd contracts/project
npx hardhat compile

# 部署到 BSC Testnet
npx hardhat run scripts/deploy.js --network bscTestnet

# 初始化池子 + 添加流动性
npx hardhat run scripts/seed-and-distribute.js --network bscTestnet
npx hardhat run scripts/add-seed-liquidity.js --network bscTestnet
```

---

## 🚀 前端开发命令

```bash
# Node.js 环境 (Windows fnm)
fnm env | Invoke-Expression
fnm use 22.13.1

# 开发
cd axonswap-web
npm install          # 安装依赖
npx vite --port 3000 # 启动开发服务器

# 构建
npx vite build       # 产物 → dist/

# Vercel 部署
vercel --prod
```

---

## 🔗 添加新链指南 (Multi-Chain Extension)

> 以下说明如何在 AxonSwap 添加一条新链支持。

### 第 1 步: 部署合约到新链

1. **配置 Hardhat 网络** — 编辑 `contracts/project/hardhat.config.ts`:
   ```typescript
   // >>>>>> 多链扩展点: 在此添加新链网络配置 <<<<<<
   networks: {
     bscTestnet: { ... },               // 已有
     newChain: {                          // 新增
       url: "NEW_CHAIN_RPC_URL",
       chainId: NEW_CHAIN_ID,
       accounts: [DEPLOYER_PRIVATE_KEY],
       gasPrice: ...,
     },
   }
   ```

2. **运行部署脚本**:
   ```bash
   npx hardhat run scripts/deploy.js --network newChain
   npx hardhat run scripts/seed-and-distribute.js --network newChain
   npx hardhat run scripts/add-seed-liquidity.js --network newChain
   ```
   部署结果自动保存到 `deployments/newChain.json`

3. **合约品牌化注意**: 
   - `v3-periphery/contracts/NonfungiblePositionManager.sol` 第 75 行，确认构造函数中 name 为 "AxonSwap V3 Positions NFT-V1"
   - 如果修改了 Pool 合约字节码，需重新计算 POOL_INIT_CODE_HASH

### 第 2 步: 前端添加新链

1. **添加链定义** — 新建 `axonswap-web/src/config/chains/{newChain}.ts`:
   ```typescript
   // >>>>>> 多链扩展点: 每条链一个文件 <<<<<<
   import { defineChain } from 'viem'
   
   export const newChain = defineChain({
     id: NEW_CHAIN_ID,
     name: 'New Chain Name',
     nativeCurrency: { name: '...', symbol: '...', decimals: 18 },
     rpcUrls: {
       default: { http: ['https://rpc-url'] },
       public:  { http: ['https://rpc-url', 'https://rpc-fallback'] },
     },
     blockExplorers: {
       default: { name: 'Explorer', url: 'https://explorer-url' },
     },
     testnet: true/false,
   })
   ```

2. **添加合约地址** — 编辑 `axonswap-web/src/config/contracts.ts`:
   ```typescript
   // >>>>>> 多链扩展点: 按 chainId 组织合约地址 <<<<<<
   export const CONTRACTS_BY_CHAIN: Record<number, typeof CONTRACTS> = {
     97: CONTRACTS,             // BSC Testnet (已有)
     [NEW_CHAIN_ID]: {          // 新链
       WBNB: '0x...',           // 或 WETH / WMATIC 等
       Factory: '0x...',
       SwapRouter: '0x...',
       NonfungiblePositionManager: '0x...',
       QuoterV2: '0x...',
       Multicall2: '0x...',
       // ... 代币地址
     },
   }
   ```

3. **添加代币列表** — 编辑 `axonswap-web/src/config/tokens.ts`:
   ```typescript
   // >>>>>> 多链扩展点: 按 chainId 组织代币列表 <<<<<<
   export const DEFAULT_TOKENS_BY_CHAIN: Record<number, Token[]> = {
     97: DEFAULT_TOKENS,                // BSC Testnet (已有)
     [NEW_CHAIN_ID]: [NATIVE_NEW, ...], // 新链代币
   }
   ```

4. **添加链到 wagmi 配置** — 编辑 `axonswap-web/src/config/wagmi.ts`:
   ```typescript
   // >>>>>> 多链扩展点: chains 数组添加新链 <<<<<<
   chains: [bscTestnet, newChain],
   ```

5. **原生币处理** — 如果新链原生币不是 BNB:
   - 修改 `NATIVE_TOKEN` 或按链提供不同的 NATIVE_TOKEN
   - 修改 WBNB 相关逻辑为通用 WRAPPED_NATIVE_TOKEN
   - Swap/Liquidity 页面的 wrap/unwrap 逻辑保持通用 (使用 deposit/withdraw ABI)

### 第 3 步: 需要修改的文件清单

| 文件 | 修改内容 | 修改标记 |
|------|----------|----------|
| `config/chains.ts` (或 chains/ 目录) | 新链 defineChain 定义 | `多链扩展点` |
| `config/contracts.ts` | 新链合约地址 | `多链扩展点` |
| `config/tokens.ts` | 新链代币列表 + NATIVE_TOKEN | `多链扩展点` |
| `config/wagmi.ts` | chains 数组添加新链 | `多链扩展点` |
| `pages/SwapPage.tsx` | 如果原生币符号不同, 需更新 wrap/unwrap 判断 | 搜索 `WBNB` |
| `pages/PoolPage.tsx` | LEGACY_POSITION_MANAGERS 按链区分 | 搜索 `LEGACY` |
| `pages/AddLiquidityPage.tsx` | 原生币 toggle 按钮文本 | 搜索 `tBNB` |
| `pages/PositionDetailPage.tsx` | 同上 | 搜索 `tBNB` |
| `hooks/useQuote.ts` | QuoterV2 地址需按链获取 | 搜索 `QuoterV2` |
| `hardhat.config.ts` | 新链网络配置 | `networks` |

### 第 4 步: 测试检查清单

- [ ] 钱包能切换到新链
- [ ] 代币余额正确显示
- [ ] Swap: ERC20↔ERC20 正常
- [ ] Swap: 原生币↔ERC20 正常 (wrap/unwrap)
- [ ] Add Liquidity: 创建新仓位正常
- [ ] Increase Liquidity: 追加到已有仓位 (不创建新 NFT)
- [ ] Remove Liquidity: 部分/全部移除正常
- [ ] 原生币收取 (unwrapWETH9) 正常
- [ ] Pool 列表显示所有仓位

---

## 📝 关键注意事项

### 合约层
1. **POOL_INIT_CODE_HASH**: 修改 Pool 合约后必须重新计算，否则 Periphery 无法正确推算池地址
2. **evmVersion**: BSC 系列用 `istanbul`/`paris`，不支持 PUSH0 (Shanghai+)
3. **品牌化**: NonfungiblePositionManager 的 ERC721 name 在部署时确定，链上不可变
4. **费率层级**: 100 (0.01%), 500 (0.05%), 3000 (0.30%), 10000 (1.00%). tickSpacing 分别为 1, 10, 60, 200
5. **许可证**: Uniswap V3 Core 2023-04-01 后转 GPL-2.0, 可自由 Fork

### 前端层
1. **Node.js 版本**: 必须 v22.13.1 (fnm), `fnm env | Invoke-Expression; fnm use 22.13.1`
2. **开发服务器**: `npx vite --port 3000`, 不能用 bun (兼容性问题)
3. **BigInt 精度**: Max 按钮使用 `Math.floor(num * 1e6) / 1e6` 截断避免精度溢出
4. **余额查询**: 原生币用 `useBalance()`，ERC20 用 `useReadContract(balanceOf)`
5. **RPC 限频**: BSC Testnet 公共 RPC 有限频，useQuote 加 500ms debounce
6. **Legacy PM**: PoolPage 扫描 `LEGACY_POSITION_MANAGERS` 数组中所有旧 PM 的仓位

### 已知问题
1. Legacy PM 上操作时 MetaMask 显示 "Uniswap V3..." (链上 name 不可变)
2. BSC Testnet 公共 RPC 偶尔返回 "Requested resource not available" (节点限频)

---

## 📊 已验证功能 (E2E)

| 功能 | 状态 | 说明 |
|------|------|------|
| Swap: mUSDC ↔ mUSDT | ✅ | 通过 0.05% 池子 |
| Swap: tBNB → mUSDC | ✅ | 通过 0.30% 池子 |
| Swap: mUSDC → tBNB | ✅ | multicall + unwrapWETH9 |
| Swap: tBNB ↔ AXON | ✅ | 通过 0.30% 池子 |
| Swap: WBNB ↔ tBNB | ✅ | 直接 wrap/unwrap (无池子) |
| Add Liquidity (新仓位) | ✅ | mint() 创建 NFT |
| Increase Liquidity (追加) | ✅ | increaseLiquidity() 到已有 tokenId |
| Remove Liquidity (部分) | ✅ | decreaseLiquidity + collect |
| Remove Liquidity (100%) | ✅ | 关闭仓位 |
| Receive as tBNB (移除时) | ✅ | unwrapWETH9 + sweepToken |
| Token Approve 流程 | ✅ | approve → 交易 |
| 主题切换 (暗/亮) | ✅ | CSS 变量 + Zustand 持久化 |
| 多钱包连接 | ✅ | MetaMask, OKX, WalletConnect 等 |
| 旧仓位显示 | ✅ | Legacy PM 仓位带 "Legacy" 标签 |
