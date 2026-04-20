require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Chain A contracts with:", deployer.address);

  const initialSupply = ethers.utils.parseEther("1000000");
  const SourceToken = await ethers.getContractFactory("SourceToken");
  const sourceToken = await SourceToken.deploy(initialSupply);
  await sourceToken.deployed();
  console.log("SourceToken deployed to:", sourceToken.address);

  const LockBox = await ethers.getContractFactory("LockBox");
  const lockBox = await LockBox.deploy(sourceToken.address);
  await lockBox.deployed();
  console.log("LockBox deployed to:", lockBox.address);

  console.log("\n--- Add to .env ---");
  console.log(`SOURCETOKEN_ADDRESS=${sourceToken.address}`);
  console.log(`LOCKBOX_ADDRESS=${lockBox.address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});