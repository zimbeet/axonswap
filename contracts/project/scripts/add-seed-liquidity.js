/**
 * AxonSwap — Add seed liquidity to existing pools
 * Adds full-range positions to WBNB/mUSDC, mUSDC/mUSDT, WBNB/AXON
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const DEPLOYMENT_FILE = path.join(__dirname, "..", "deployments", "bscTestnet.json");

function loadArtifact(artifactPath) {
  const fullPath = path.resolve(__dirname, "..", "..", artifactPath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

// Tick spacing per fee tier
const TICK_SPACING = { 100: 1, 500: 10, 3000: 60, 10000: 200 };

function getMinMaxTick(fee) {
  const ts = TICK_SPACING[fee];
  return {
    tickLower: Math.ceil(-887272 / ts) * ts,
    tickUpper: Math.floor(887272 / ts) * ts,
  };
}

async function main() {
  const deployed = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf8"));
  const rpcUrl = process.env.BSC_TESTNET_RPC_URL || "https://bsc-testnet-rpc.publicnode.com";
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

  console.log("=".repeat(60));
  console.log("  AxonSwap — Add Seed Liquidity");
  console.log("=".repeat(60));
  console.log(`  Deployer: ${wallet.address}`);
  const bal = await wallet.getBalance();
  console.log(`  Balance:  ${ethers.utils.formatEther(bal)} tBNB`);

  const mockABI = loadArtifact("project/artifacts/contracts/tokens/MockERC20.sol/MockERC20.json").abi;
  const axonABI = loadArtifact("project/artifacts/contracts/tokens/AxonToken.sol/AxonToken.json").abi;
  const posManagerABI = loadArtifact("v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json").abi;
  const poolABI = ["function liquidity() view returns (uint128)"];

  const positionManager = new ethers.Contract(deployed.PositionManager, posManagerABI, wallet);
  const mUSDC = new ethers.Contract(deployed.mUSDC, mockABI, wallet);
  const mUSDT = new ethers.Contract(deployed.mUSDT, mockABI, wallet);
  const axonToken = new ethers.Contract(deployed.AxonToken, axonABI, wallet);

  const MAX = ethers.constants.MaxUint256;
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  // ========== Ensure tokens are approved ==========
  console.log("\n🔓 Ensuring approvals...");
  let tx;
  tx = await mUSDC.approve(deployed.PositionManager, MAX, { gasLimit: 100000 });
  await tx.wait();
  tx = await mUSDT.approve(deployed.PositionManager, MAX, { gasLimit: 100000 });
  await tx.wait();
  tx = await axonToken.approve(deployed.PositionManager, MAX, { gasLimit: 100000 });
  await tx.wait();
  console.log("   ✅ All tokens approved");

  // Check balances
  const usdcBal = await mUSDC.balanceOf(wallet.address);
  const usdtBal = await mUSDT.balanceOf(wallet.address);
  const axonBal = await axonToken.balanceOf(wallet.address);
  console.log(`   mUSDC: ${ethers.utils.formatUnits(usdcBal, 6)}`);
  console.log(`   mUSDT: ${ethers.utils.formatUnits(usdtBal, 6)}`);
  console.log(`   AXON:  ${ethers.utils.formatUnits(axonBal, 18)}`);

  // ========== Pool 1: mUSDC/mUSDT (fee=500, both 6 decimals) ==========
  console.log("\n🏊 Pool 1: mUSDC/mUSDT (0.05%)");
  {
    const fee = 500;
    const { tickLower, tickUpper } = getMinMaxTick(fee);
    const [t0, t1] = deployed.mUSDC.toLowerCase() < deployed.mUSDT.toLowerCase()
      ? [deployed.mUSDC, deployed.mUSDT] : [deployed.mUSDT, deployed.mUSDC];

    // Check current liquidity
    const poolAddr = deployed.pools?.mUSDC_mUSDT_500;
    if (poolAddr) {
      const pool = new ethers.Contract(poolAddr, poolABI, provider);
      const liq = await pool.liquidity();
      console.log(`   Current liquidity: ${liq.toString()}`);
    }

    // Add 100,000 of each stablecoin
    const amt0 = ethers.utils.parseUnits("100000", 6);
    const amt1 = ethers.utils.parseUnits("100000", 6);

    try {
      tx = await positionManager.mint(
        {
          token0: t0,
          token1: t1,
          fee,
          tickLower,
          tickUpper,
          amount0Desired: amt0,
          amount1Desired: amt1,
          amount0Min: 0,
          amount1Min: 0,
          recipient: wallet.address,
          deadline,
        },
        { gasLimit: 1000000 }
      );
      const receipt = await tx.wait();
      console.log(`   ✅ Minted position! Gas: ${receipt.gasUsed.toString()}`);
    } catch (e) {
      console.log(`   ❌ Failed: ${e.reason || e.message}`);
    }
  }

  // ========== Pool 2: WBNB/AXON (fee=3000, both 18 decimals) ==========
  console.log("\n🏊 Pool 2: WBNB/AXON (0.3%)");
  {
    const fee = 3000;
    const { tickLower, tickUpper } = getMinMaxTick(fee);
    const [t0, t1] = deployed.WBNB.toLowerCase() < deployed.AxonToken.toLowerCase()
      ? [deployed.WBNB, deployed.AxonToken] : [deployed.AxonToken, deployed.WBNB];

    const poolAddr = deployed.pools?.WBNB_AXON_3000;
    if (poolAddr) {
      const pool = new ethers.Contract(poolAddr, poolABI, provider);
      const liq = await pool.liquidity();
      console.log(`   Current liquidity: ${liq.toString()}`);
    }

    // Add 0.1 WBNB + 3000 AXON (1 WBNB = 30000 AXON)
    // token0 is the smaller address
    const isWbnbToken0 = t0.toLowerCase() === deployed.WBNB.toLowerCase();
    const wbnbAmt = ethers.utils.parseEther("0.1");
    const axonAmt = ethers.utils.parseEther("3000");

    const amt0 = isWbnbToken0 ? wbnbAmt : axonAmt;
    const amt1 = isWbnbToken0 ? axonAmt : wbnbAmt;

    try {
      tx = await positionManager.mint(
        {
          token0: t0,
          token1: t1,
          fee,
          tickLower,
          tickUpper,
          amount0Desired: amt0,
          amount1Desired: amt1,
          amount0Min: 0,
          amount1Min: 0,
          recipient: wallet.address,
          deadline,
        },
        { gasLimit: 1000000, value: wbnbAmt } // Send BNB for WBNB side
      );
      const receipt = await tx.wait();
      console.log(`   ✅ Minted position! Gas: ${receipt.gasUsed.toString()}`);
    } catch (e) {
      console.log(`   ❌ Failed: ${e.reason || e.message}`);
    }
  }

  // ========== Verify ==========
  console.log("\n📊 Verifying pools...");
  for (const [name, addr] of Object.entries(deployed.pools || {})) {
    const pool = new ethers.Contract(addr, poolABI, provider);
    const liq = await pool.liquidity();
    console.log(`   ${name}: liquidity=${liq.toString()}`);
  }

  const finalBal = await wallet.getBalance();
  console.log(`\n  Remaining: ${ethers.utils.formatEther(finalBal)} tBNB`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  });
