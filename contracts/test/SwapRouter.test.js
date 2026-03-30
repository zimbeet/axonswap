const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwapRouter", function () {
  let factory;
  let waxon;
  let router;
  let tokenA;
  let tokenB;
  let pool;
  let owner;
  let user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy WAXON
    const WAXON = await ethers.getContractFactory("WAXON");
    waxon = await WAXON.deploy();
    await waxon.deployed();

    // Deploy Factory
    const Factory = await ethers.getContractFactory("AxonSwapFactory");
    factory = await Factory.deploy();
    await factory.deployed();

    // Deploy Router
    const Router = await ethers.getContractFactory("SwapRouter");
    router = await Router.deploy(factory.address, waxon.address);
    await router.deployed();

    // Deploy two mock tokens
    const TokenA = await ethers.getContractFactory("WAXON");
    const TokenB = await ethers.getContractFactory("WAXON");
    const tokenAContract = await TokenA.deploy();
    const tokenBContract = await TokenB.deploy();
    await tokenAContract.deployed();
    await tokenBContract.deployed();

    // Sort tokens
    if (tokenAContract.address.toLowerCase() < tokenBContract.address.toLowerCase()) {
      tokenA = tokenAContract;
      tokenB = tokenBContract;
    } else {
      tokenA = tokenBContract;
      tokenB = tokenAContract;
    }
  });

  describe("Deployment", function () {
    it("Should have correct factory address", async function () {
      expect(await router.factory()).to.equal(factory.address);
    });

    it("Should have correct WAXON address", async function () {
      expect(await router.WAXON()).to.equal(waxon.address);
    });
  });

  describe("Pool Setup", function () {
    it("Should create pool via factory", async function () {
      const tx = await factory.createPool(tokenA.address, tokenB.address, 3000);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "PoolCreated");
      expect(event).to.not.be.undefined;

      const poolAddress = await factory.getPool(tokenA.address, tokenB.address, 3000);
      expect(poolAddress).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should initialize pool", async function () {
      await factory.createPool(tokenA.address, tokenB.address, 3000);
      const poolAddress = await factory.getPool(tokenA.address, tokenB.address, 3000);

      const Pool = await ethers.getContractAt("AxonSwapPool", poolAddress);

      // Initialize with 1:1 price (sqrtPriceX96 for price = 1)
      const sqrtPriceX96 = ethers.BigNumber.from("79228162514264337593543950336"); // sqrt(1) * 2^96
      await Pool.initialize(sqrtPriceX96);

      const slot0 = await Pool.slot0();
      expect(slot0.sqrtPriceX96).to.equal(sqrtPriceX96);
    });
  });

  describe("Basic Swap Flow", function () {
    it("Should set up a complete swap scenario", async function () {
      // 1. Create pool
      await factory.createPool(tokenA.address, tokenB.address, 3000);
      const poolAddress = await factory.getPool(tokenA.address, tokenB.address, 3000);
      const Pool = await ethers.getContractAt("AxonSwapPool", poolAddress);

      // 2. Initialize pool (1:1 price)
      const sqrtPriceX96 = ethers.BigNumber.from("79228162514264337593543950336");
      await Pool.initialize(sqrtPriceX96);

      // 3. Verify pool state
      const slot0 = await Pool.slot0();
      expect(slot0.unlocked).to.equal(true);
      expect(slot0.sqrtPriceX96).to.equal(sqrtPriceX96);

      // 4. Verify pool immutables
      expect(await Pool.factory()).to.equal(factory.address);
      expect(await Pool.token0()).to.equal(tokenA.address);
      expect(await Pool.token1()).to.equal(tokenB.address);
      expect(await Pool.fee()).to.equal(3000);
      expect(await Pool.tickSpacing()).to.equal(60);
    });

    it("Router should accept ETH via receive", async function () {
      // Send some ETH to the router
      await owner.sendTransaction({
        to: router.address,
        value: ethers.utils.parseEther("1.0"),
      });

      const balance = await ethers.provider.getBalance(router.address);
      expect(balance).to.equal(ethers.utils.parseEther("1.0"));
    });
  });
});
