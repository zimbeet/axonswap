/**
 * AxonSwap — Redeploy NFTDescriptor + PositionManager with AxonSwap branding
 * Only redeploys these 3 contracts, updates deployment file and frontend config
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const DEPLOYMENT_FILE = path.join(__dirname, "..", "deployments", "bscTestnet.json");

function loadArtifact(relPath) {
  const fullPath = path.resolve(__dirname, "..", "..", relPath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

async function main() {
  const deployed = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf8"));
  const rpcUrl = process.env.BSC_TESTNET_RPC_URL || "https://bsc-testnet-rpc.publicnode.com";
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

  console.log("=".repeat(60));
  console.log("  AxonSwap — Redeploy NFTDescriptor + PositionManager");
  console.log("=".repeat(60));
  console.log(`  Deployer: ${wallet.address}`);
  const bal = await wallet.getBalance();
  console.log(`  Balance:  ${ethers.utils.formatEther(bal)} tBNB`);

  // 1. Deploy NFTDescriptor library (new bytecode with AxonSwap branding)
  console.log("\n🚀 Deploying NFTDescriptor library...");
  const nftDescLibArtifact = loadArtifact(
    "v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"
  );
  const nftDescLibFactory = new ethers.ContractFactory(
    nftDescLibArtifact.abi, nftDescLibArtifact.bytecode, wallet
  );
  const nftDescLib = await nftDescLibFactory.deploy();
  await nftDescLib.deployed();
  console.log(`   ✅ NFTDescriptor library: ${nftDescLib.address}`);

  // 2. Deploy NonfungibleTokenPositionDescriptor (links to new library)
  console.log("\n🚀 Deploying NFTPositionDescriptor...");
  const label = ethers.utils.formatBytes32String("BNB");
  const descriptorArtifact = loadArtifact(
    "v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"
  );
  const linkedBytecode = descriptorArtifact.bytecode.replace(
    /__\$[a-fA-F0-9]{34}\$__/g,
    nftDescLib.address.slice(2).toLowerCase()
  );
  const descriptorFactory = new ethers.ContractFactory(
    descriptorArtifact.abi, linkedBytecode, wallet
  );
  const descriptor = await descriptorFactory.deploy(deployed.WBNB, label);
  await descriptor.deployed();
  console.log(`   ✅ NFTPositionDescriptor: ${descriptor.address}`);

  // 3. Deploy NonfungiblePositionManager (new branding)
  console.log("\n🚀 Deploying NonfungiblePositionManager...");
  const pmArtifact = loadArtifact(
    "v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"
  );
  const pmFactory = new ethers.ContractFactory(pmArtifact.abi, pmArtifact.bytecode, wallet);
  const pm = await pmFactory.deploy(deployed.Factory, deployed.WBNB, descriptor.address);
  await pm.deployed();
  console.log(`   ✅ NonfungiblePositionManager: ${pm.address}`);

  // Verify the NFT name
  const nftName = await pm.name();
  const nftSymbol = await pm.symbol();
  console.log(`   NFT Name: "${nftName}", Symbol: "${nftSymbol}"`);

  // Update deployment file
  deployed.NFTDescriptorLib_v2 = nftDescLib.address;
  deployed.NFTDescriptor_v2 = descriptor.address;
  deployed.PositionManager_old = deployed.PositionManager;
  deployed.PositionManager = pm.address;
  deployed.NFTDescriptorLib = nftDescLib.address;
  deployed.NFTDescriptor = descriptor.address;
  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(deployed, null, 2));

  const finalBal = await wallet.getBalance();
  console.log(`\n  Gas used: ${ethers.utils.formatEther(bal.sub(finalBal))} tBNB`);
  console.log(`  Remaining: ${ethers.utils.formatEther(finalBal)} tBNB`);
  console.log("\n  ⚠️  Update frontend config/contracts.ts:");
  console.log(`     NonfungiblePositionManager: '${pm.address}'`);
  console.log(`     NFTDescriptor: '${descriptor.address}'`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  });
