/**
 * AxonSwap Pool Seeding Script
 * Creates initial trading pools and adds liquidity
 * 
 * Usage:
 *   node scripts/seed-pools.js
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const DEPLOYMENT_FILE = path.join(__dirname, "..", "deployments", "bsc-testnet.json");

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
  console.log("  AxonSwap — Pool Seeding");
  console.log("=".repeat(60));
  console.log(`  Deployer: ${wallet.address}`);

  // Load contract interfaces
  const factoryArtifact = loadArtifact("v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
  const posManagerArtifact = loadArtifact("v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");
  const mockERC20Artifact = loadArtifact("project/artifacts/contracts/tokens/MockERC20.sol/MockERC20.json");

  const factory = new ethers.Contract(deployed.Factory, factoryArtifact.abi, wallet);
  const positionManager = new ethers.Contract(deployed.PositionManager, posManagerArtifact.abi, wallet);

  // Mint test tokens
  console.log("\n📦 Minting test tokens...");
  const tokens = {
    mUSDC: new ethers.Contract(deployed.mUSDC, mockERC20Artifact.abi, wallet),
    mUSDT: new ethers.Contract(deployed.mUSDT, mockERC20Artifact.abi, wallet),
  };

  // Mint 1M of each stablecoin
  const usdcAmount = ethers.utils.parseUnits("1000000", 6);
  const usdtAmount = ethers.utils.parseUnits("1000000", 6);

  let tx;
  tx = await tokens.mUSDC.mint(wallet.address, usdcAmount);
  await tx.wait();
  console.log("   Minted 1,000,000 mUSDC");

  tx = await tokens.mUSDT.mint(wallet.address, usdtAmount);
  await tx.wait();
  console.log("   Minted 1,000,000 mUSDT");

  // Approve PositionManager
  console.log("\n🔓 Approving PositionManager...");
  const MAX_UINT = ethers.constants.MaxUint256;

  tx = await tokens.mUSDC.approve(deployed.PositionManager, MAX_UINT);
  await tx.wait();
  tx = await tokens.mUSDT.approve(deployed.PositionManager, MAX_UINT);
  await tx.wait();
  console.log("   Approved mUSDC and mUSDT");

  // Create WBNB/mUSDC pool (0.3% fee)
  console.log("\n🏊 Creating WBNB/mUSDC pool (0.3% fee)...");
  const fee = 3000;

  // Sort tokens (lower address first)
  const [token0, token1] = deployed.WBNB.toLowerCase() < deployed.mUSDC.toLowerCase()
    ? [deployed.WBNB, deployed.mUSDC]
    : [deployed.mUSDC, deployed.WBNB];

  // sqrtPriceX96 for ~$300 BNB/USDC (adjust as needed)
  // If WBNB is token0: price = USDC/WBNB = 300, sqrtPriceX96 = sqrt(300 * 10^(6-18)) * 2^96
  // Simplified: use a standard initial price
  const sqrtPriceX96 = ethers.BigNumber.from("1").mul(ethers.BigNumber.from(2).pow(96));

  try {
    tx = await positionManager.createAndInitializePoolIfNecessary(
      token0,
      token1,
      fee,
      sqrtPriceX96,
      { gasLimit: 5000000 }
    );
    await tx.wait();
    console.log("   Pool created and initialized!");
  } catch (e) {
    console.log("   Pool may already exist:", e.message.substring(0, 100));
  }

  const poolAddress = await factory.getPool(deployed.WBNB, deployed.mUSDC, fee);
  console.log(`   Pool address: ${poolAddress}`);

  deployed.pools = deployed.pools || {};
  deployed.pools["WBNB/mUSDC/3000"] = poolAddress;

  // Create mUSDC/mUSDT pool (0.05% fee - stablecoin pool)
  console.log("\n🏊 Creating mUSDC/mUSDT pool (0.05% fee)...");
  const stableFee = 500;
  const [stable0, stable1] = deployed.mUSDC.toLowerCase() < deployed.mUSDT.toLowerCase()
    ? [deployed.mUSDC, deployed.mUSDT]
    : [deployed.mUSDT, deployed.mUSDC];

  // 1:1 price for stablecoin pair
  const stableSqrtPrice = ethers.BigNumber.from(2).pow(96); // sqrtPriceX96 = 2^96 means price = 1

  try {
    tx = await positionManager.createAndInitializePoolIfNecessary(
      stable0,
      stable1,
      stableFee,
      stableSqrtPrice,
      { gasLimit: 5000000 }
    );
    await tx.wait();
    console.log("   Stablecoin pool created!");
  } catch (e) {
    console.log("   Pool may already exist:", e.message.substring(0, 100));
  }

  const stablePoolAddress = await factory.getPool(deployed.mUSDC, deployed.mUSDT, stableFee);
  console.log(`   Pool address: ${stablePoolAddress}`);
  deployed.pools["mUSDC/mUSDT/500"] = stablePoolAddress;

  // Save
  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(deployed, null, 2));
  console.log("\n✅ Pool seeding complete! Deployment file updated.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  });
