/**
 * AxonSwap — Seed pools, mint tokens, and transfer 10% to recipient
 * 
 * Usage:
 *   cd contracts/project
 *   node scripts/seed-and-distribute.js
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const DEPLOYMENT_FILE = path.join(__dirname, "..", "deployments", "bscTestnet.json");
const RECIPIENT = "0x0EFdC1D636C288b953986372e95BA3f64F554c56";

function loadArtifact(artifactPath) {
  const fullPath = path.resolve(__dirname, "..", "..", artifactPath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

async function main() {
  const deployed = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf8"));
  const rpcUrl = process.env.BSC_TESTNET_RPC_URL || "https://bsc-testnet-rpc.publicnode.com";
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

  console.log("=".repeat(60));
  console.log("  AxonSwap — Seed Pools & Distribute Tokens");
  console.log("=".repeat(60));
  console.log(`  Deployer:  ${wallet.address}`);
  console.log(`  Recipient: ${RECIPIENT}`);
  const bal = await wallet.getBalance();
  console.log(`  Balance:   ${ethers.utils.formatEther(bal)} tBNB`);

  // ABIs
  const mockABI = loadArtifact("project/artifacts/contracts/tokens/MockERC20.sol/MockERC20.json").abi;
  const axonABI = loadArtifact("project/artifacts/contracts/tokens/AxonToken.sol/AxonToken.json").abi;
  const factoryABI = loadArtifact("v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json").abi;
  const posManagerABI = loadArtifact("v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json").abi;

  const factory = new ethers.Contract(deployed.Factory, factoryABI, wallet);
  const positionManager = new ethers.Contract(deployed.PositionManager, posManagerABI, wallet);

  // Token contracts
  const axonToken = new ethers.Contract(deployed.AxonToken, axonABI, wallet);
  const mUSDC = new ethers.Contract(deployed.mUSDC, mockABI, wallet);
  const mUSDT = new ethers.Contract(deployed.mUSDT, mockABI, wallet);
  const mWBTC = new ethers.Contract(deployed.mWBTC, mockABI, wallet);
  const mWETH = new ethers.Contract(deployed.mWETH, mockABI, wallet);

  const gasOpts = { gasLimit: 300000 };

  // ========== Step 1: Mint tokens ==========
  console.log("\n📦 Step 1: Minting test tokens...");

  let tx;
  tx = await mUSDC.mint(wallet.address, ethers.utils.parseUnits("10000000", 6), gasOpts);
  await tx.wait(); console.log("   ✅ Minted 10,000,000 mUSDC");

  tx = await mUSDT.mint(wallet.address, ethers.utils.parseUnits("10000000", 6), gasOpts);
  await tx.wait(); console.log("   ✅ Minted 10,000,000 mUSDT");

  tx = await mWBTC.mint(wallet.address, ethers.utils.parseUnits("100", 8), gasOpts);
  await tx.wait(); console.log("   ✅ Minted 100 mWBTC");

  tx = await mWETH.mint(wallet.address, ethers.utils.parseUnits("5000", 18), gasOpts);
  await tx.wait(); console.log("   ✅ Minted 5,000 mWETH");

  // ========== Step 2: Transfer 10% to recipient ==========
  console.log(`\n💸 Step 2: Transferring 10% to ${RECIPIENT}...`);

  // AXON: 10% of 100M = 10M
  const axonBal = await axonToken.balanceOf(wallet.address);
  const axon10pct = axonBal.div(10);
  tx = await axonToken.transfer(RECIPIENT, axon10pct, gasOpts);
  await tx.wait();
  console.log(`   ✅ AXON: ${ethers.utils.formatUnits(axon10pct, 18)} sent`);

  // mUSDC: 10% = 1,000,000
  tx = await mUSDC.transfer(RECIPIENT, ethers.utils.parseUnits("1000000", 6), gasOpts);
  await tx.wait(); console.log("   ✅ mUSDC: 1,000,000 sent");

  // mUSDT: 10% = 1,000,000
  tx = await mUSDT.transfer(RECIPIENT, ethers.utils.parseUnits("1000000", 6), gasOpts);
  await tx.wait(); console.log("   ✅ mUSDT: 1,000,000 sent");

  // mWBTC: 10% = 10
  tx = await mWBTC.transfer(RECIPIENT, ethers.utils.parseUnits("10", 8), gasOpts);
  await tx.wait(); console.log("   ✅ mWBTC: 10 sent");

  // mWETH: 10% = 500
  tx = await mWETH.transfer(RECIPIENT, ethers.utils.parseUnits("500", 18), gasOpts);
  await tx.wait(); console.log("   ✅ mWETH: 500 sent");

  // ========== Step 3: Approve tokens for PositionManager ==========
  console.log("\n🔓 Step 3: Approving PositionManager...");
  const MAX = ethers.constants.MaxUint256;

  tx = await mUSDC.approve(deployed.PositionManager, MAX, gasOpts);
  await tx.wait();
  tx = await mUSDT.approve(deployed.PositionManager, MAX, gasOpts);
  await tx.wait();
  tx = await mWBTC.approve(deployed.PositionManager, MAX, gasOpts);
  await tx.wait();
  tx = await mWETH.approve(deployed.PositionManager, MAX, gasOpts);
  await tx.wait();
  tx = await axonToken.approve(deployed.PositionManager, MAX, gasOpts);
  await tx.wait();
  console.log("   ✅ All tokens approved");

  // Also approve SwapRouter
  tx = await mUSDC.approve(deployed.SwapRouter, MAX, gasOpts);
  await tx.wait();
  tx = await mUSDT.approve(deployed.SwapRouter, MAX, gasOpts);
  await tx.wait();
  console.log("   ✅ SwapRouter approved");

  // ========== Step 4: Create Pools ==========
  console.log("\n🏊 Step 4: Creating pools...");

  deployed.pools = deployed.pools || {};

  // Pool 1: WBNB/mUSDC (0.3% fee)
  {
    const fee = 3000;
    const [t0, t1] = deployed.WBNB.toLowerCase() < deployed.mUSDC.toLowerCase()
      ? [deployed.WBNB, deployed.mUSDC] : [deployed.mUSDC, deployed.WBNB];
    
    // Price: 1 WBNB = 300 USDC
    // sqrtPriceX96 depends on token order
    let sqrtPriceX96;
    if (t0.toLowerCase() === deployed.WBNB.toLowerCase()) {
      // token0=WBNB, token1=USDC: price = USDC_amount / WBNB_amount in token units
      // 300 USDC (6 dec) per 1 WBNB (18 dec) → price = 300e6 / 1e18 = 3e-10
      // sqrtPrice = sqrt(3e-10) * 2^96
      const price = 300e6 / 1e18; // = 3e-10
      sqrtPriceX96 = ethers.BigNumber.from(
        Math.floor(Math.sqrt(price) * (2 ** 96)).toLocaleString('fullwide', {useGrouping:false})
      );
    } else {
      // token0=USDC, token1=WBNB: price = WBNB_amount / USDC_amount
      // 1e18 / 300e6 = 3.33e9
      const price = 1e18 / (300 * 1e6);
      sqrtPriceX96 = ethers.BigNumber.from(
        Math.floor(Math.sqrt(price) * (2 ** 96)).toLocaleString('fullwide', {useGrouping:false})
      );
    }

    try {
      tx = await positionManager.createAndInitializePoolIfNecessary(t0, t1, fee, sqrtPriceX96, { gasLimit: 5000000 });
      await tx.wait();
      const pool = await factory.getPool(deployed.WBNB, deployed.mUSDC, fee);
      deployed.pools["WBNB_mUSDC_3000"] = pool;
      console.log(`   ✅ WBNB/mUSDC pool: ${pool}`);
    } catch (e) {
      console.log(`   ⚠️ WBNB/mUSDC: ${e.message.substring(0, 80)}`);
    }
  }

  // Pool 2: mUSDC/mUSDT (0.05% fee — stablecoin pair)
  {
    const fee = 500;
    const [t0, t1] = deployed.mUSDC.toLowerCase() < deployed.mUSDT.toLowerCase()
      ? [deployed.mUSDC, deployed.mUSDT] : [deployed.mUSDT, deployed.mUSDC];

    // 1:1 price, both 6 decimals
    const sqrtPriceX96 = ethers.BigNumber.from(2).pow(96); // price = 1

    try {
      tx = await positionManager.createAndInitializePoolIfNecessary(t0, t1, fee, sqrtPriceX96, { gasLimit: 5000000 });
      await tx.wait();
      const pool = await factory.getPool(deployed.mUSDC, deployed.mUSDT, fee);
      deployed.pools["mUSDC_mUSDT_500"] = pool;
      console.log(`   ✅ mUSDC/mUSDT pool: ${pool}`);
    } catch (e) {
      console.log(`   ⚠️ mUSDC/mUSDT: ${e.message.substring(0, 80)}`);
    }
  }

  // Pool 3: WBNB/AXON (0.3% fee)
  {
    const fee = 3000;
    const [t0, t1] = deployed.WBNB.toLowerCase() < deployed.AxonToken.toLowerCase()
      ? [deployed.WBNB, deployed.AxonToken] : [deployed.AxonToken, deployed.WBNB];

    // Price: 1 WBNB = 30000 AXON (both 18 decimals)
    let sqrtPriceX96;
    if (t0.toLowerCase() === deployed.WBNB.toLowerCase()) {
      // token0=WBNB, token1=AXON: price = 30000 (same decimals)
      sqrtPriceX96 = ethers.BigNumber.from(
        Math.floor(Math.sqrt(30000) * (2 ** 96)).toLocaleString('fullwide', {useGrouping:false})
      );
    } else {
      // token0=AXON, token1=WBNB: price = 1/30000
      sqrtPriceX96 = ethers.BigNumber.from(
        Math.floor(Math.sqrt(1/30000) * (2 ** 96)).toLocaleString('fullwide', {useGrouping:false})
      );
    }

    try {
      tx = await positionManager.createAndInitializePoolIfNecessary(t0, t1, fee, sqrtPriceX96, { gasLimit: 5000000 });
      await tx.wait();
      const pool = await factory.getPool(deployed.WBNB, deployed.AxonToken, fee);
      deployed.pools["WBNB_AXON_3000"] = pool;
      console.log(`   ✅ WBNB/AXON pool: ${pool}`);
    } catch (e) {
      console.log(`   ⚠️ WBNB/AXON: ${e.message.substring(0, 80)}`);
    }
  }

  // Save deployment
  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(deployed, null, 2));
  console.log("\n" + "=".repeat(60));
  const finalBal = await wallet.getBalance();
  console.log(`  ✅ Complete! Remaining: ${ethers.utils.formatEther(finalBal)} tBNB`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  });
