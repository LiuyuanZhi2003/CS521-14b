const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Chain A contracts with:", deployer.address);

  const initialSupply = ethers.parseEther("1000000");
  const SourceToken = await ethers.getContractFactory("SourceToken");
  const sourceToken = await SourceToken.deploy(initialSupply);
  await sourceToken.waitForDeployment();
  const sourceTokenAddr = await sourceToken.getAddress();
  console.log("SourceToken deployed to:", sourceTokenAddr);

  const LockBox = await ethers.getContractFactory("LockBox");
  const lockBox = await LockBox.deploy(sourceTokenAddr);
  await lockBox.waitForDeployment();
  const lockBoxAddr = await lockBox.getAddress();
  console.log("LockBox deployed to:", lockBoxAddr);

  console.log("\n--- Copy these into your environment ---");
  console.log(`SOURCETOKEN_ADDRESS=${sourceTokenAddr}`);
  console.log(`LOCKBOX_ADDRESS=${lockBoxAddr}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});