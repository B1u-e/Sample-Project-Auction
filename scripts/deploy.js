const { ethers, network, run } = require("hardhat");

async function main() {
  // create factory
  const auctionFactory = await ethers.getContractFactory("Auction");

  // deploy contract from factory
  const [deployer] = await ethers.getSigners();
  const auction = await auctionFactory.deploy(deployer.address, 600);

  // 等待6个区块确认,确认完之后才会执行下一步操作
  console.log("waiting for 6 blocks confirmations...");
  await auction.waitForDeployment(6);

  console.log(
    `contract has been deployed successfully, contract address is ${auction.target}`
  );

  if (hre.network.config.chainId == 43113) {
    await hre.run("verify:verify", {
      address: auction.target, // 合约地址
      constructorArguments: [deployer.address, 600], // 合约构造函数的参数
    });
    console.log("verification successfully");
  } else {
    console.log("verification skipped...");
  }
}

main()
  .then()
  .catch((error) => {
    console.error(error);
    process.exit(0);
  });
