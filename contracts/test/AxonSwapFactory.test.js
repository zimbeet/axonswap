const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AxonSwapFactory", function () {
  let factory;
  let owner;
  let addr1;
  let tokenA;
  let tokenB;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    // Deploy factory
    const Factory = await ethers.getContractFactory("AxonSwapFactory");
    factory = await Factory.deploy();
    await factory.deployed();

    // Deploy two mock ERC-20 tokens (using WAXON as a token since it's ERC-20 compatible)
    const WAXON = await ethers.getContractFactory("WAXON");
    const tokenAContract = await WAXON.deploy();
    const tokenBContract = await WAXON.deploy();
    await tokenAContract.deployed();
    await tokenBContract.deployed();

    // Sort tokens by address
    if (tokenAContract.address.toLowerCase() < tokenBContract.address.toLowerCase()) {
      tokenA = tokenAContract.address;
      tokenB = tokenBContract.address;
    } else {
      tokenA = tokenBContract.address;
      tokenB = tokenAContract.address;
    }
  });

  describe("Deployment", function () {
    it("Should set the owner", async function () {
      expect(await factory.owner()).to.equal(owner.address);
    });

    it("Should have default fee tiers", async function () {
      expect(await factory.feeAmountTickSpacing(500)).to.equal(10);
      expect(await factory.feeAmountTickSpacing(3000)).to.equal(60);
      expect(await factory.feeAmountTickSpacing(10000)).to.equal(200);
    });
  });

  describe("createPool", function () {
    it("Should create a pool", async function () {
      const tx = await factory.createPool(tokenA, tokenB, 3000);
      const receipt = await tx.wait();

      // Check event was emitted
      const event = receipt.events.find((e) => e.event === "PoolCreated");
      expect(event).to.not.be.undefined;
      expect(event.args.token0).to.equal(tokenA);
      expect(event.args.token1).to.equal(tokenB);
      expect(event.args.fee).to.equal(3000);
    });

    it("Should return correct pool address from getPool", async function () {
      await factory.createPool(tokenA, tokenB, 3000);

      const pool = await factory.getPool(tokenA, tokenB, 3000);
      expect(pool).to.not.equal(ethers.constants.AddressZero);

      // Both directions should return the same pool
      const poolReverse = await factory.getPool(tokenB, tokenA, 3000);
      expect(poolReverse).to.equal(pool);
    });

    it("Should revert on duplicate pool", async function () {
      await factory.createPool(tokenA, tokenB, 3000);
      await expect(factory.createPool(tokenA, tokenB, 3000)).to.be.reverted;
    });

    it("Should revert with same token", async function () {
      await expect(factory.createPool(tokenA, tokenA, 3000)).to.be.reverted;
    });

    it("Should revert with invalid fee", async function () {
      await expect(factory.createPool(tokenA, tokenB, 999)).to.be.reverted;
    });

    it("Should allow creating pools with different fee tiers", async function () {
      await factory.createPool(tokenA, tokenB, 500);
      await factory.createPool(tokenA, tokenB, 3000);
      await factory.createPool(tokenA, tokenB, 10000);

      const pool500 = await factory.getPool(tokenA, tokenB, 500);
      const pool3000 = await factory.getPool(tokenA, tokenB, 3000);
      const pool10000 = await factory.getPool(tokenA, tokenB, 10000);

      expect(pool500).to.not.equal(pool3000);
      expect(pool3000).to.not.equal(pool10000);
    });
  });

  describe("Fee tier management", function () {
    it("Owner should be able to enable new fee amount", async function () {
      await factory.enableFeeAmount(100, 2);
      expect(await factory.feeAmountTickSpacing(100)).to.equal(2);
    });

    it("Non-owner should not be able to enable fee amount", async function () {
      await expect(
        factory.connect(addr1).enableFeeAmount(100, 2)
      ).to.be.reverted;
    });

    it("Should not enable already-enabled fee amount", async function () {
      await expect(factory.enableFeeAmount(3000, 60)).to.be.reverted;
    });
  });

  describe("Ownership", function () {
    it("Should transfer ownership", async function () {
      await factory.setOwner(addr1.address);
      expect(await factory.owner()).to.equal(addr1.address);
    });

    it("Non-owner should not be able to transfer ownership", async function () {
      await expect(factory.connect(addr1).setOwner(addr1.address)).to.be
        .reverted;
    });
  });
});
