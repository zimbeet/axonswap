const fs = require("fs");
const path = require("path");

async function main() {
  const deploymentsPath = path.join(
    __dirname,
    "..",
    "deployments",
    "axon-mainnet.json"
  );

  if (!fs.existsSync(deploymentsPath)) {
    console.error(
      "❌ Deployments file not found at:",
      deploymentsPath,
      "\n   Run deploy.js first."
    );
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  // Support both the structured format { contracts: {...} } and flat format
  const addresses = raw.contracts || raw;

  console.log("=".repeat(70));
  console.log("  AxonSwap — Contract Verification Commands");
  console.log("  Explorer: https://explorer.axonchain.ai");
  console.log("=".repeat(70));
  console.log();

  // WAXON — no constructor args
  if (addresses.WAXON) {
    console.log("# WAXON");
    console.log(
      `npx hardhat verify --network axon ${addresses.WAXON}`
    );
    console.log();
  }

  // AxonSwapFactory — no constructor args
  if (addresses.AxonSwapFactory) {
    console.log("# AxonSwapFactory");
    console.log(
      `npx hardhat verify --network axon ${addresses.AxonSwapFactory}`
    );
    console.log();
  }

  // AxonSwapPoolDeployer — no constructor args
  if (addresses.AxonSwapPoolDeployer) {
    console.log("# AxonSwapPoolDeployer");
    console.log(
      `npx hardhat verify --network axon ${addresses.AxonSwapPoolDeployer}`
    );
    console.log();
  }

  // SwapRouter — factory + WAXON
  if (addresses.SwapRouter) {
    console.log("# SwapRouter");
    console.log(
      `npx hardhat verify --network axon ${addresses.SwapRouter} "${addresses.AxonSwapFactory}" "${addresses.WAXON}"`
    );
    console.log();
  }

  // NonfungiblePositionManager — factory + WAXON
  if (addresses.NonfungiblePositionManager) {
    console.log("# NonfungiblePositionManager");
    console.log(
      `npx hardhat verify --network axon ${addresses.NonfungiblePositionManager} "${addresses.AxonSwapFactory}" "${addresses.WAXON}"`
    );
    console.log();
  }

  // Quoter — factory + WAXON
  if (addresses.Quoter) {
    console.log("# Quoter");
    console.log(
      `npx hardhat verify --network axon ${addresses.Quoter} "${addresses.AxonSwapFactory}" "${addresses.WAXON}"`
    );
    console.log();
  }

  // QuoterV2 — factory + WAXON
  if (addresses.QuoterV2) {
    console.log("# QuoterV2");
    console.log(
      `npx hardhat verify --network axon ${addresses.QuoterV2} "${addresses.AxonSwapFactory}" "${addresses.WAXON}"`
    );
    console.log();
  }

  // TickLens — no constructor args
  if (addresses.TickLens) {
    console.log("# TickLens");
    console.log(
      `npx hardhat verify --network axon ${addresses.TickLens}`
    );
    console.log();
  }

  // Multicall — no constructor args
  if (addresses.Multicall) {
    console.log("# Multicall");
    console.log(
      `npx hardhat verify --network axon ${addresses.Multicall}`
    );
    console.log();
  }

  console.log("=".repeat(70));
  console.log("  Copy-paste the commands above to verify each contract.");
  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
