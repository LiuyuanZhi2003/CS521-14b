const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Chain B contracts with:", deployer.address);

  // The relayer address must match the private key used in relayer.js
  // By default we use the second Hardhat account as the relayer
  const signers = await ethers.getSigners();
  const relayerAddress = signers[1].address;
  console.log("Relayer address:", relayerAddress);

  // Deploy WrappedToken, passing relayer address for signature verification
  const WrappedToken = await ethers.getContractFactory("WrappedToken");
  const wrappedToken = await WrappedToken.deploy(relayerAddress);
  await wrappedToken.waitForDeployment();
  const wrappedTokenAddr = await wrappedToken.getAddress();
  console.log("WrappedToken deployed to:", wrappedTokenAddr);

  // Deploy MintBridge, pointing to WrappedToken and relayer
  const MintBridge = await ethers.getContractFactory("MintBridge");
  const mintBridge = await MintBridge.deploy(wrappedTokenAddr, relayerAddress);
  await mintBridge.waitForDeployment();
  const mintBridgeAddr = await mintBridge.getAddress();
  console.log("MintBridge deployed to:", mintBridgeAddr);

  // WrappedToken's relayer is set to relayerAddress, but MintBridge also calls
  // wrappedToken.mint() — so we need to update WrappedToken's relayer to MintBridge
  // so that only MintBridge (not the raw relayer wallet) can call mint directly.
  // For simplicity in this demo, we set relayer = MintBridge address:
  const updateTx = await wrappedToken.setRelayer(mintBridgeAddr);
  await updateTx.wait();
  console.log("WrappedToken relayer updated to MintBridge:", mintBridgeAddr);

  console.log("\n--- Copy these into your environment ---");
  console.log(`WRAPPEDTOKEN_ADDRESS=${wrappedTokenAddr}`);
  console.log(`MINTBRIDGE_ADDRESS=${mintBridgeAddr}`);
  console.log(`RELAYER_KEY=<private key of ${relayerAddress}>`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});