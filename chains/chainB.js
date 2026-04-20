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

  // Update WrappedToken's relayer to MintBridge so only MintBridge can call mint
  const tx = await wrappedToken.setRelayer(mintBridge.address);
  await tx.wait();
  console.log("WrappedToken relayer updated to MintBridge");

  console.log("\n--- Add to .env ---");
  console.log(`WRAPPEDTOKEN_ADDRESS=${wrappedToken.address}`);
  console.log(`MINTBRIDGE_ADDRESS=${mintBridge.address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});