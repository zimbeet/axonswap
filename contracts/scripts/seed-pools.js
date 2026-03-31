/**
 * seed-pools.js — Create initial WAXON/USDC and WAXON/USDT pools on AxonSwap.
 *
 * Prerequisites:
 *   1. Run deploy.js first so that deployments/axon-mainnet.json exists.
 *   2. Set USDC_ADDRESS and USDT_ADDRESS in your .env file.
 *   3. The deployer wallet must hold some WAXON (or AXON to wrap).
 *
 * Usage:
 *   npx hardhat run scripts/seed-pools.js --network axon
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Fee tier: 0.30%
const FEE_TIER = 3000;

// sqrtPriceX96 for 1 WAXON = 1 USD (both 18-decimal tokens)
// formula: sqrt(price) * 2^96  where price = token1/token0 (sorted by address)
// This is an approximation; adjust before mainnet use.
const SQRT_PRICE_1_TO_1 = BigInt("79228162514264337593543950336");

async function loadAddresses() {
  const deploymentsPath = path.join(
    __dirname,
    "..",
    "deployments",
    "axon-mainnet.json"
  );
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(
      `Deployments file not found at ${deploymentsPath}. Run deploy.js first.`
    );
  }
  const raw = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  // Support both the structured format { contracts: {...} } and flat format
  return raw.contracts || raw;
}

async function createPool(factory, token0, token1, fee, sqrtPriceX96) {
  // Sort tokens (factory requires token0 < token1)
  const [t0, t1] =
    token0.toLowerCase() < token1.toLowerCase()
      ? [token0, token1]
      : [token1, token0];

  console.log(`  Creating pool: ${t0} / ${t1} @ fee ${fee}`);
  const tx = await factory.createPool(t0, t1, fee);
  const receipt = await tx.wait();
  const event = receipt.events.find((e) => e.event === "PoolCreated");
  const poolAddress = event ? event.args.pool : await factory.getPool(t0, t1, fee);
  console.log(`  Pool deployed at: ${poolAddress}`);

  // Initialize the pool with a starting price
  const pool = await hre.ethers.getContractAt(
    [
      "function initialize(uint160 sqrtPriceX96) external",
      "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    ],
    poolAddress
  );

  try {
    const slot0 = await pool.slot0();
    if (slot0.sqrtPriceX96 === 0n) {
      const initTx = await pool.initialize(sqrtPriceX96);
      await initTx.wait();
      console.log(`  Pool initialized with sqrtPriceX96: ${sqrtPriceX96}`);
    } else {
      console.log(`  Pool already initialized, skipping.`);
    }
  } catch {
    // Pool not yet initialized
    const initTx = await pool.initialize(sqrtPriceX96);
    await initTx.wait();
    console.log(`  Pool initialized with sqrtPriceX96: ${sqrtPriceX96}`);
  }

  return poolAddress;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Seeding pools with account:", deployer.address);

  const addresses = await loadAddresses();

  const usdcAddress = process.env.USDC_ADDRESS;
  const usdtAddress = process.env.USDT_ADDRESS;

  if (!usdcAddress || !usdtAddress) {
    console.warn(
      "⚠️  USDC_ADDRESS or USDT_ADDRESS not set in .env — skipping those pools."
    );
  }

  const factory = await hre.ethers.getContractAt(
    [
      "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)",
      "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
      "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
    ],
    addresses.AxonSwapFactory
  );

  console.log("\n--- Creating WAXON/USDC pool (0.30%) ---");
  if (usdcAddress) {
    await createPool(
      factory,
      addresses.WAXON,
      usdcAddress,
      FEE_TIER,
      SQRT_PRICE_1_TO_1
    );
  } else {
    console.log("  Skipped (USDC_ADDRESS not set).");
  }

  console.log("\n--- Creating WAXON/USDT pool (0.30%) ---");
  if (usdtAddress) {
    await createPool(
      factory,
      addresses.WAXON,
      usdtAddress,
      FEE_TIER,
      SQRT_PRICE_1_TO_1
    );
  } else {
    console.log("  Skipped (USDT_ADDRESS not set).");
  }

  console.log("\n✅ Pool seeding complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
