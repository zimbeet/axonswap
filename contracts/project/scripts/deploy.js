/**
 * AxonSwap Full Deployment Script
 * Deploys all V3 contracts + custom tokens
 * Supports resumable deployment (skips already-deployed contracts)
 * 
 * Usage:
 *   cd contracts/project
 *   npx hardhat run scripts/deploy.js --network bscTestnet
 *   npx hardhat run scripts/deploy.js --network hardhat  (local test)
 */

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const NETWORK = hre.network.name;
const DEPLOYMENT_FILE = path.join(__dirname, "..", "deployments", `${NETWORK}.json`);

function loadExternalArtifact(relPath) {
  const fullPath = path.resolve(__dirname, "..", "..", relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Artifact not found: ${fullPath}`);
  }
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function loadDeployment() {
  if (fs.existsSync(DEPLOYMENT_FILE)) {
    return JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf8"));
  }
  return {};
}

function saveDeployment(data) {
  const dir = path.dirname(DEPLOYMENT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(data, null, 2));
}

async function deployExternal(signer, name, relArtifactPath, args = []) {
  console.log(`\n🚀 Deploying ${name}...`);
  const artifact = loadExternalArtifact(relArtifactPath);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.deployed();
  console.log(`   ✅ ${name} deployed at: ${contract.address}`);
  return contract;
}

async function deployLocal(signer, contractName, args = []) {
  console.log(`\n🚀 Deploying ${contractName}...`);
  const factory = await ethers.getContractFactory(contractName, signer);
  const contract = await factory.deploy(...args);
  await contract.deployed();
  console.log(`   ✅ ${contractName} deployed at: ${contract.address}`);
  return contract;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.getBalance();

  console.log("=".repeat(60));
  console.log("  AxonSwap V3 — Full Deployment");
  console.log("=".repeat(60));
  console.log(`  Network:  ${NETWORK}`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Balance:  ${ethers.utils.formatEther(balance)} BNB`);
  console.log("=".repeat(60));

  if (NETWORK === "bscTestnet" && balance.lt(ethers.utils.parseEther("0.05"))) {
    console.error(`\n❌ Insufficient balance! Send tBNB to: ${deployer.address}`);
    console.error("   Faucet: https://www.bnbchain.org/en/testnet-faucet");
    process.exit(1);
  }

  const d = loadDeployment();

  // === Phase 1: Core ===

  if (!d.WBNB) {
    const c = await deployLocal(deployer, "WBNB");
    d.WBNB = c.address; saveDeployment(d);
  } else console.log(`\n⏭️  WBNB: ${d.WBNB}`);

  if (!d.Factory) {
    const c = await deployExternal(deployer, "AxonSwapFactory",
      "v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
    d.Factory = c.address; saveDeployment(d);
  } else console.log(`\n⏭️  Factory: ${d.Factory}`);

  if (!d.PoolInitCodeHash) {
    const poolArtifact = loadExternalArtifact(
      "v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");
    d.PoolInitCodeHash = ethers.utils.keccak256(poolArtifact.bytecode);
    saveDeployment(d);
  }
  console.log(`\n🔑 POOL_INIT_CODE_HASH: ${d.PoolInitCodeHash}`);

  if (!d.SwapRouter) {
    const c = await deployExternal(deployer, "SwapRouter",
      "v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json",
      [d.Factory, d.WBNB]);
    d.SwapRouter = c.address; saveDeployment(d);
  } else console.log(`\n⏭️  SwapRouter: ${d.SwapRouter}`);

  if (!d.NFTDescriptor) {
    // First deploy the NFTDescriptor library
    const nftDescLibArtifact = loadExternalArtifact(
      "v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json");
    const nftDescLib = await deployExternal(deployer, "NFTDescriptor (library)",
      "v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json");
    d.NFTDescriptorLib = nftDescLib.address;
    saveDeployment(d);

    // Now deploy NonfungibleTokenPositionDescriptor with linked library
    const label = ethers.utils.formatBytes32String("BNB");
    const descriptorArtifact = loadExternalArtifact(
      "v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json");
    // Link the NFTDescriptor library in bytecode
    const linkedBytecode = descriptorArtifact.bytecode.replace(
      /__\$[a-fA-F0-9]{34}\$__/g,
      nftDescLib.address.slice(2).toLowerCase()
    );
    const descriptorFactory = new ethers.ContractFactory(
      descriptorArtifact.abi, linkedBytecode, deployer);
    console.log(`\n🚀 Deploying NFTPositionDescriptor...`);
    const descriptorContract = await descriptorFactory.deploy(d.WBNB, label);
    await descriptorContract.deployed();
    console.log(`   ✅ NFTPositionDescriptor deployed at: ${descriptorContract.address}`);
    d.NFTDescriptor = descriptorContract.address;
    saveDeployment(d);
  } else console.log(`\n⏭️  NFTDescriptor: ${d.NFTDescriptor}`);

  if (!d.PositionManager) {
    const c = await deployExternal(deployer, "NonfungiblePositionManager",
      "v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json",
      [d.Factory, d.WBNB, d.NFTDescriptor]);
    d.PositionManager = c.address; saveDeployment(d);
  } else console.log(`\n⏭️  PositionManager: ${d.PositionManager}`);

  if (!d.Quoter) {
    const c = await deployExternal(deployer, "Quoter",
      "v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json",
      [d.Factory, d.WBNB]);
    d.Quoter = c.address; saveDeployment(d);
  } else console.log(`\n⏭️  Quoter: ${d.Quoter}`);

  if (!d.QuoterV2) {
    const c = await deployExternal(deployer, "QuoterV2",
      "v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json",
      [d.Factory, d.WBNB]);
    d.QuoterV2 = c.address; saveDeployment(d);
  } else console.log(`\n⏭️  QuoterV2: ${d.QuoterV2}`);

  if (!d.TickLens) {
    const c = await deployExternal(deployer, "TickLens",
      "v3-periphery/artifacts/contracts/lens/TickLens.sol/TickLens.json");
    d.TickLens = c.address; saveDeployment(d);
  } else console.log(`\n⏭️  TickLens: ${d.TickLens}`);

  if (!d.Multicall2) {
    const c = await deployLocal(deployer, "Multicall2");
    d.Multicall2 = c.address; saveDeployment(d);
  } else console.log(`\n⏭️  Multicall2: ${d.Multicall2}`);

  if (!d.InterfaceMulticall) {
    const c = await deployExternal(deployer, "UniswapInterfaceMulticall",
      "v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json");
    d.InterfaceMulticall = c.address; saveDeployment(d);
  } else console.log(`\n⏭️  InterfaceMulticall: ${d.InterfaceMulticall}`);

  // === Phase 2: Tokens ===
  console.log("\n" + "=".repeat(60));
  console.log("  Phase 2: Tokens");
  console.log("=".repeat(60));

  if (!d.AxonToken) {
    const c = await deployLocal(deployer, "AxonToken");
    d.AxonToken = c.address; saveDeployment(d);
  } else console.log(`\n⏭️  AxonToken: ${d.AxonToken}`);

  const mockTokens = [
    { key: "mUSDC", name: "Mock USDC", symbol: "mUSDC", decimals: 6 },
    { key: "mUSDT", name: "Mock USDT", symbol: "mUSDT", decimals: 6 },
    { key: "mWBTC", name: "Mock WBTC", symbol: "mWBTC", decimals: 8 },
    { key: "mWETH", name: "Mock WETH", symbol: "mWETH", decimals: 18 },
  ];

  for (const t of mockTokens) {
    if (!d[t.key]) {
      const c = await deployLocal(deployer, "MockERC20", [t.name, t.symbol, t.decimals]);
      d[t.key] = c.address; saveDeployment(d);
    } else console.log(`\n⏭️  ${t.key}: ${d[t.key]}`);
  }

  // === Summary ===
  console.log("\n" + "=".repeat(60));
  console.log("  🎉 Deployment Complete!");
  console.log("=".repeat(60));
  console.log(JSON.stringify(d, null, 2));
  console.log(`\nSaved to: ${DEPLOYMENT_FILE}`);

  const finalBal = await deployer.getBalance();
  console.log(`Remaining: ${ethers.utils.formatEther(finalBal)} BNB`);
  console.log(`Gas spent: ${ethers.utils.formatEther(balance.sub(finalBal))} BNB`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Deployment failed:", err.message);
    process.exit(1);
  });
