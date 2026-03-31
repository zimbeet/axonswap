const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  console.log("---");

  const addresses = {};

  // 1. Deploy WAXON
  console.log("1. Deploying WAXON...");
  const WAXON = await hre.ethers.getContractFactory("WAXON");
  const waxon = await WAXON.deploy();
  await waxon.deployed();
  addresses.WAXON = waxon.address;
  console.log("   WAXON deployed to:", waxon.address);

  // 2. Deploy AxonSwapFactory
  console.log("2. Deploying AxonSwapFactory...");
  const Factory = await hre.ethers.getContractFactory("AxonSwapFactory");
  const factory = await Factory.deploy();
  await factory.deployed();
  addresses.AxonSwapFactory = factory.address;
  console.log("   AxonSwapFactory deployed to:", factory.address);

  // 3. Deploy SwapRouter
  console.log("3. Deploying SwapRouter...");
  const Router = await hre.ethers.getContractFactory("SwapRouter");
  const router = await Router.deploy(factory.address, waxon.address);
  await router.deployed();
  addresses.SwapRouter = router.address;
  console.log("   SwapRouter deployed to:", router.address);

  // 4. Deploy NonfungiblePositionManager
  console.log("4. Deploying NonfungiblePositionManager...");
  const PositionManager = await hre.ethers.getContractFactory(
    "NonfungiblePositionManager"
  );
  const positionManager = await PositionManager.deploy(
    factory.address,
    waxon.address
  );
  await positionManager.deployed();
  addresses.NonfungiblePositionManager = positionManager.address;
  console.log(
    "   NonfungiblePositionManager deployed to:",
    positionManager.address
  );

  // 5. Deploy Quoter
  console.log("5. Deploying Quoter...");
  const Quoter = await hre.ethers.getContractFactory("Quoter");
  const quoter = await Quoter.deploy(factory.address, waxon.address);
  await quoter.deployed();
  addresses.Quoter = quoter.address;
  console.log("   Quoter deployed to:", quoter.address);

  // 6. Deploy QuoterV2
  console.log("6. Deploying QuoterV2...");
  const QuoterV2 = await hre.ethers.getContractFactory("QuoterV2");
  const quoterV2 = await QuoterV2.deploy(factory.address, waxon.address);
  await quoterV2.deployed();
  addresses.QuoterV2 = quoterV2.address;
  console.log("   QuoterV2 deployed to:", quoterV2.address);

  // 7. Deploy TickLens
  console.log("7. Deploying TickLens...");
  const TickLens = await hre.ethers.getContractFactory("TickLens");
  const tickLens = await TickLens.deploy();
  await tickLens.deployed();
  addresses.TickLens = tickLens.address;
  console.log("   TickLens deployed to:", tickLens.address);

  // 8. Deploy Multicall
  console.log("8. Deploying Multicall...");
  const Multicall = await hre.ethers.getContractFactory("Multicall");
  const multicall = await Multicall.deploy();
  await multicall.deployed();
  addresses.Multicall = multicall.address;
  console.log("   Multicall deployed to:", multicall.address);

  // 9. Verify fee tiers on factory
  console.log("9. Verifying fee tiers...");
  const fee500 = await factory.feeAmountTickSpacing(500);
  const fee3000 = await factory.feeAmountTickSpacing(3000);
  const fee10000 = await factory.feeAmountTickSpacing(10000);
  console.log(
    `   Fee tiers: 500(${fee500}), 3000(${fee3000}), 10000(${fee10000})`
  );

  // 10. Save addresses
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  const outputPath = path.join(deploymentsDir, "axon-mainnet.json");
  const output = {
    chainId: 8210,
    network: "axon-mainnet",
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: addresses,
  };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log("10. Addresses saved to:", outputPath);

  // 11. Summary
  console.log("\n" + "=".repeat(60));
  console.log("  AxonSwap Deployment Summary");
  console.log("  Chain: Axon Mainnet (Chain ID: 8210)");
  console.log("=".repeat(60));
  Object.entries(addresses).forEach(([name, addr]) => {
    console.log(`  ${name.padEnd(35)} ${addr}`);
  });
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
