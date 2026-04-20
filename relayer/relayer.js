require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

function loadABI(contractName) {
  const artifactPath = path.resolve(
    __dirname,
    `../artifacts/contracts/${contractName}.sol/${contractName}.json`
  );
  return JSON.parse(fs.readFileSync(artifactPath)).abi;
}

const LockBoxABI    = loadABI("LockBox");
const MintBridgeABI = loadABI("MintBridge");

const providerA = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const providerB = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8546");

const {
  RELAYER_KEY,
  LOCKBOX_ADDRESS,
  MINTBRIDGE_ADDRESS,
} = process.env;

const relayerWalletA = new ethers.Wallet(RELAYER_KEY, providerA);
const relayerWalletB = new ethers.Wallet(RELAYER_KEY, providerB);

const lockBox    = new ethers.Contract(LOCKBOX_ADDRESS, LockBoxABI, relayerWalletA);
const mintBridge = new ethers.Contract(MINTBRIDGE_ADDRESS, MintBridgeABI, relayerWalletB);

async function signAttestation(to, amount, nonce) {
  const message = ethers.utils.solidityKeccak256(
    ["address", "uint256", "uint256"],
    [to, amount, nonce]
  );
  // arrayify converts hex string to Uint8Array; signMessage adds the Ethereum prefix
  return relayerWalletB.signMessage(ethers.utils.arrayify(message));
}

async function main() {
  console.log("=================================");
  console.log("Relayer started");
  console.log(`Relayer address : ${relayerWalletB.address}`);
  console.log(`Listening on    : LockBox @ ${LOCKBOX_ADDRESS} (Chain A :8545)`);
  console.log(`Submitting to   : MintBridge @ ${MINTBRIDGE_ADDRESS} (Chain B :8546)`);
  console.log("=================================\n");

  lockBox.on("TokensLocked", async (sender, amount, nonce) => {
    console.log(`[Chain A] TokensLocked`);
    console.log(`  Sender : ${sender}`);
    console.log(`  Amount : ${ethers.utils.formatEther(amount)} SRC`);
    console.log(`  Nonce  : ${nonce.toString()}`);

    try {
      const sig = await signAttestation(sender, amount, nonce);
      console.log(`[Relayer] Signed attestation: ${sig.slice(0, 22)}...`);

      const tx = await mintBridge.bridge(sender, amount, nonce, sig);
      const receipt = await tx.wait();
      console.log(`[Chain B] Mint tx: ${receipt.transactionHash}`);
      console.log(`[Chain B] Minted ${ethers.utils.formatEther(amount)} wSRC to ${sender}\n`);
    } catch (err) {
      console.error("[Relayer] Error:", err.message);
    }
  });
}

main().catch(console.error);