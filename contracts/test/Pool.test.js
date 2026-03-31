const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AxonSwapPool", function () {
  let factory;
  let pool;
  let tokenA;
  let tokenB;
  let owner;

  // sqrtPriceX96 for a 1:1 price ratio (sqrt(1) * 2^96)
  const SQRT_PRICE_1_TO_1 = ethers.BigNumber.from(
    "79228162514264337593543950336"
  );

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    // Deploy Factory
    const Factory = await ethers.getContractFactory("AxonSwapFactory");
    factory = await Factory.deploy();
    await factory.deployed();

    // Deploy two mock ERC-20 tokens
    const Token = await ethers.getContractFactory("WAXON");
    const tokenAContract = await Token.deploy();
    const tokenBContract = await Token.deploy();
    await tokenAContract.deployed();
    await tokenBContract.deployed();

    // Sort so token0 < token1
    if (
      tokenAContract.address.toLowerCase() <
      tokenBContract.address.toLowerCase()
    ) {
      tokenA = tokenAContract;
      tokenB = tokenBContract;
    } else {
      tokenA = tokenBContract;
      tokenB = tokenAContract;
    }

    // Create pool
    await factory.createPool(tokenA.address, tokenB.address, 3000);
    const poolAddress = await factory.getPool(
      tokenA.address,
      tokenB.address,
      3000
    );
    pool = await ethers.getContractAt("AxonSwapPool", poolAddress);
  });

  describe("Immutables", function () {
    it("Should have correct factory", async function () {
      expect(await pool.factory()).to.equal(factory.address);
    });

    it("Should have correct token0 and token1 (sorted)", async function () {
      expect(await pool.token0()).to.equal(tokenA.address);
      expect(await pool.token1()).to.equal(tokenB.address);
    });

    it("Should have correct fee", async function () {
      expect(await pool.fee()).to.equal(3000);
    });

    it("Should have correct tick spacing for 0.30% fee", async function () {
      expect(await pool.tickSpacing()).to.equal(60);
    });
  });

  describe("Initialization", function () {
    it("Should start uninitialized (sqrtPriceX96 = 0)", async function () {
      const slot0 = await pool.slot0();
      expect(slot0.sqrtPriceX96).to.equal(0);
    });

    it("Should initialize with a valid sqrtPriceX96", async function () {
      await pool.initialize(SQRT_PRICE_1_TO_1);
      const slot0 = await pool.slot0();
      expect(slot0.sqrtPriceX96).to.equal(SQRT_PRICE_1_TO_1);
    });

    it("Should set unlocked to true after initialization", async function () {
      await pool.initialize(SQRT_PRICE_1_TO_1);
      const slot0 = await pool.slot0();
      expect(slot0.unlocked).to.equal(true);
    });

    it("Should revert if already initialized", async function () {
      await pool.initialize(SQRT_PRICE_1_TO_1);
      await expect(pool.initialize(SQRT_PRICE_1_TO_1)).to.be.reverted;
    });

    it("Should revert if sqrtPriceX96 is zero", async function () {
      await expect(pool.initialize(0)).to.be.reverted;
    });
  });

  describe("Liquidity", function () {
    it("Should start with zero liquidity", async function () {
      expect(await pool.liquidity()).to.equal(0);
    });

    it("Liquidity stays zero before any mint", async function () {
      await pool.initialize(SQRT_PRICE_1_TO_1);
      expect(await pool.liquidity()).to.equal(0);
    });
  });

  describe("Fee growth tracking", function () {
    it("Should have zero initial feeGrowthGlobal0X128", async function () {
      expect(await pool.feeGrowthGlobal0X128()).to.equal(0);
    });

    it("Should have zero initial feeGrowthGlobal1X128", async function () {
      expect(await pool.feeGrowthGlobal1X128()).to.equal(0);
    });
  });

  describe("Protocol fees", function () {
    it("Should have zero initial protocol fees", async function () {
      const fees = await pool.protocolFees();
      expect(fees.token0).to.equal(0);
      expect(fees.token1).to.equal(0);
    });
  });
});
