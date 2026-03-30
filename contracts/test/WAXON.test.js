const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WAXON", function () {
  let waxon;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const WAXON = await ethers.getContractFactory("WAXON");
    waxon = await WAXON.deploy();
    await waxon.deployed();
  });

  describe("Deployment", function () {
    it("Should have correct name and symbol", async function () {
      expect(await waxon.name()).to.equal("Wrapped AXON");
      expect(await waxon.symbol()).to.equal("WAXON");
      expect(await waxon.decimals()).to.equal(18);
    });

    it("Should have 0 initial supply", async function () {
      expect(await waxon.totalSupply()).to.equal(0);
    });
  });

  describe("Deposit", function () {
    it("Should wrap AXON on deposit", async function () {
      const depositAmount = ethers.utils.parseEther("1.0");
      await waxon.deposit({ value: depositAmount });
      expect(await waxon.balanceOf(owner.address)).to.equal(depositAmount);
      expect(await waxon.totalSupply()).to.equal(depositAmount);
    });

    it("Should wrap AXON when sending ETH directly", async function () {
      const depositAmount = ethers.utils.parseEther("2.0");
      await owner.sendTransaction({
        to: waxon.address,
        value: depositAmount,
      });
      expect(await waxon.balanceOf(owner.address)).to.equal(depositAmount);
    });

    it("Should emit Deposit event", async function () {
      const depositAmount = ethers.utils.parseEther("1.0");
      await expect(waxon.deposit({ value: depositAmount }))
        .to.emit(waxon, "Deposit")
        .withArgs(owner.address, depositAmount);
    });
  });

  describe("Withdraw", function () {
    it("Should unwrap WAXON on withdraw", async function () {
      const depositAmount = ethers.utils.parseEther("1.0");
      await waxon.deposit({ value: depositAmount });

      const balanceBefore = await owner.getBalance();
      const tx = await waxon.withdraw(depositAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      expect(await waxon.balanceOf(owner.address)).to.equal(0);
      expect(await owner.getBalance()).to.equal(
        balanceBefore.add(depositAmount).sub(gasUsed)
      );
    });

    it("Should revert on insufficient balance", async function () {
      const withdrawAmount = ethers.utils.parseEther("1.0");
      await expect(waxon.withdraw(withdrawAmount)).to.be.revertedWith(
        "WAXON: insufficient balance"
      );
    });

    it("Should emit Withdrawal event", async function () {
      const depositAmount = ethers.utils.parseEther("1.0");
      await waxon.deposit({ value: depositAmount });
      await expect(waxon.withdraw(depositAmount))
        .to.emit(waxon, "Withdrawal")
        .withArgs(owner.address, depositAmount);
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens", async function () {
      const depositAmount = ethers.utils.parseEther("10.0");
      const transferAmount = ethers.utils.parseEther("5.0");
      await waxon.deposit({ value: depositAmount });
      await waxon.transfer(addr1.address, transferAmount);

      expect(await waxon.balanceOf(owner.address)).to.equal(
        depositAmount.sub(transferAmount)
      );
      expect(await waxon.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should revert on insufficient balance", async function () {
      await expect(
        waxon.transfer(addr1.address, ethers.utils.parseEther("1.0"))
      ).to.be.revertedWith("WAXON: insufficient balance");
    });
  });

  describe("Approve and TransferFrom", function () {
    it("Should approve and transferFrom", async function () {
      const depositAmount = ethers.utils.parseEther("10.0");
      const approveAmount = ethers.utils.parseEther("5.0");
      await waxon.deposit({ value: depositAmount });
      await waxon.approve(addr1.address, approveAmount);

      expect(await waxon.allowance(owner.address, addr1.address)).to.equal(
        approveAmount
      );

      await waxon
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, approveAmount);

      expect(await waxon.balanceOf(addr2.address)).to.equal(approveAmount);
      expect(await waxon.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should revert transferFrom with insufficient allowance", async function () {
      const depositAmount = ethers.utils.parseEther("10.0");
      await waxon.deposit({ value: depositAmount });

      await expect(
        waxon
          .connect(addr1)
          .transferFrom(
            owner.address,
            addr2.address,
            ethers.utils.parseEther("1.0")
          )
      ).to.be.revertedWith("WAXON: insufficient allowance");
    });

    it("Should not decrease allowance on max approval", async function () {
      const depositAmount = ethers.utils.parseEther("10.0");
      const transferAmount = ethers.utils.parseEther("5.0");
      await waxon.deposit({ value: depositAmount });
      await waxon.approve(addr1.address, ethers.constants.MaxUint256);

      await waxon
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, transferAmount);

      expect(await waxon.allowance(owner.address, addr1.address)).to.equal(
        ethers.constants.MaxUint256
      );
    });

    it("Should emit Approval event", async function () {
      const approveAmount = ethers.utils.parseEther("5.0");
      await expect(waxon.approve(addr1.address, approveAmount))
        .to.emit(waxon, "Approval")
        .withArgs(owner.address, addr1.address, approveAmount);
    });
  });
});
