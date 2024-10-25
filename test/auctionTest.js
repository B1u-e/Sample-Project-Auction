//导入chai断言库
const { expect } = require("chai");

//导入hardhat管理器
const {
  time,
  helpers,
  mine,
} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Auction Contract Test", function () {
  let Auction; // 合约工厂
  let auction; // 合约实例
  let beneficiary; // 受益人
  let bidder1, bidder2; // 测试账户列表
  let biddingTime = 600; // 竞标时间设置为 10 分钟（600 秒）
  let highestBid; // 最高出价
  let timeLeft; // 剩余时间

  beforeEach(async function () {
    // 获取测试环境账户
    [beneficiary, bidder1, bidder2] = await ethers.getSigners();

    // 部署合约
    Auction = await ethers.getContractFactory("Auction");
    auction = await Auction.deploy(beneficiary.address, biddingTime);

    // 等待部署完成
    await auction.waitForDeployment();
  });

  // 测试构造函数是否正确设置
  it("1. should set the auction beneficiary and end time correctly", async function () {
    // 受益人地址是否相同
    expect(await auction.beneficiary()).to.equal(beneficiary.address);
    // 拍卖结束时间是否大于当前时间（拍卖还没有结束
    expect(await auction.auctionEndTime()).to.be.above(
      Math.floor(Date.now() / 1000)
    );
  });

  // 测试拍卖是否已经结束
  it("2. should not allow bidding after the auction has ended", async function () {
    // 模拟时间跳过拍卖时间
    await time.increase(biddingTime + 1);

    // 尝试进行出价，预期肯定会失败并用expect捕获错误
    await expect(
      auction.connect(bidder1).bid({
        value: ethers.parseEther("1"),
      })
    ).to.be.revertedWithCustomError(auction, "AuctionAlreadyEnded");
  });

  // 测试最高出价者是否更新成功
  it("3. should allow bidders to bid and update highest bidder successfully", async function () {
    // 测试bidder1出价
    await auction.connect(bidder1).bid({
      value: ethers.parseEther("1"),
    });

    // 验证最高出价者和最高出价金额是否为bidder1
    expect(await auction.highestBidder()).to.equal(bidder1.address);
    expect(await auction.highestBid()).to.equal(ethers.parseEther("1"));

    // 测试bidder2出价
    await auction.connect(bidder2).bid({
      value: ethers.parseEther("2"),
    });

    // 验证最高出价者和最高出价金额是否为bidder2
    expect(await auction.highestBidder()).to.equal(bidder2.address);
    expect(await auction.highestBid()).to.equal(ethers.parseEther("2"));
  });

  // 测试出价不足的情况
  it("4. should revert if bid is not hight enough", async function () {
    // 尝试进行两次出价，并且第二次出价低于第一次,并捕捉错误
    await auction.connect(bidder1).bid({
      value: ethers.parseEther("1"),
    });

    await expect(
      auction.connect(bidder2).bid({
        value: ethers.parseEther("0.5"),
      })
    )
      .to.be.revertedWithCustomError(auction, "BidNotHighEnough")
      .withArgs(await auction.highestBid());
  });

  // 测试在冷却时间内继续出价--出价失败
  it("5. should revert if bidder tries to bid again before cooldown", async function () {
    await auction.connect(bidder1).bid({
      value: ethers.parseEther("1"),
    });

    await expect(
      auction.connect(bidder1).bid({
        value: ethers.parseEther("2"),
      })
    ).to.be.revertedWithCustomError(auction, "CooldownTime");
  });

  // 测试冷却时间结束后继续出价--出价成功
  it("6. should allow bidding again after cooldown period --successfully", async function () {
    await auction.connect(bidder1).bid({
      value: ethers.parseEther("1"),
    });

    await time.increase(60); // 模拟时间增加60s，确保冷却时间已过

    await auction.connect(bidder1).bid({
      value: ethers.parseEther("2"),
    });
  });

  //测试拍卖时间延长
  it("7. should extend the auction time if bid is placed in the last minutes", async function () {
    await auction.connect(bidder1).bid({
      value: ethers.parseEther("1"),
    });

    //把时间快进到最后一分钟
    await time.increase(biddingTime - 60);
    await mine();

    const previousEndTime = await auction.auctionEndTime();
    await auction.connect(bidder2).bid({
      value: ethers.parseEther("2"),
    });

    const newEndTime = await auction.auctionEndTime();
    expect(newEndTime).to.be.above(previousEndTime);
  });

  // 测试Withdraw 函数
  it("8. should allow bidders to withdraw their funds successfully", async function () {
    await auction.connect(bidder1).bid({ value: ethers.parseEther("1") });

    await auction.connect(bidder2).bid({ value: ethers.parseEther("2") });

    const initialBalance = await ethers.provider.getBalance(bidder1.address);

    // 执行提款操作
    await auction.connect(bidder1).withdraw();

    // 获取提款后的余额
    const finalBalance = await ethers.provider.getBalance(bidder1.address);

    // 提款后的余额应该大于初始余额
    expect(finalBalance).to.be.above(initialBalance);
  });

  // 测试auctionEnd函数
  it("9. should end the auction and transfer funds to the beneficiary--successfully", async function () {
    await auction.connect(bidder1).bid({ value: ethers.parseEther("1") });

    // 快进到拍卖结束
    await time.increase(biddingTime + 1);
    await mine();

    // changeEtherBalance 是一个用于测试以太币余额变化的方法，通常在智能合约测试中使用。它的作用是验证某个操作（如调用智能合约的某个方法）是否导致指定地址的以太币余额发生了预期的变化。
    await expect(auction.auctionEnd()).to.changeEtherBalance(
      beneficiary,
      ethers.parseEther("1")
    );
  });

  // 多次结束拍卖
  it("10. should revert when trying to end auction multiple times", async function () {
    await auction.connect(bidder1).bid({ value: ethers.parseEther("1") });

    await time.increase(biddingTime + 1);
    await mine();

    await auction.auctionEnd();

    await expect(auction.auctionEnd()).to.be.revertedWithCustomError(
      auction,
      "AuctionEndAlready"
    );
  });

  // 不能提前结束竞拍
  it("11. should revert when trying to end auction before the end time", async function () {
    await auction.connect(bidder1).bid({ value: ethers.parseEther("1") });

    await expect(auction.auctionEnd()).to.be.revertedWithCustomError(
      auction,
      "AuctionNotYetEnded"
    );
  });
});
