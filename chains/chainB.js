require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer, relayer] = await ethers.getSigners();
  console.log("Deploying Chain B contracts with:", deployer.address);
  console.log("Relayer address:", relayer.address);

  const WrappedToken = await ethers.getContractFactory("WrappedToken");
  const wrappedToken = await WrappedToken.deploy(relayer.address);
  await wrappedToken.deployed();
  console.log("WrappedToken deployed to:", wrappedToken.address);

  const MintBridge = await ethers.getContractFactory("MintBridge");
  const mintBridge = await MintBridge.deploy(wrappedToken.address, relayer.address);
  await mintBridge.deployed();
  console.log("MintBridge deployed to:", mintBridge.address);

  // WrappedToken verifies signature against relayer wallet address — no setRelayer needed

  console.log("\n--- Add to .env ---");
  console.log(`WRAPPEDTOKEN_ADDRESS=${wrappedToken.address}`);
  console.log(`MINTBRIDGE_ADDRESS=${mintBridge.address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});