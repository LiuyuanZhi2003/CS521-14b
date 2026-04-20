const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load ABIs from Hardhat artifacts
function loadABI(contractName) {
  const artifactPath = path.resolve(
    __dirname,
    `../artifacts/contracts/${contractName}.sol/${contractName}.json`
  );
  return JSON.parse(fs.readFileSync(artifactPath)).abi;
}

const LockBoxABI     = loadABI("LockBox");
const MintBridgeABI  = loadABI("MintBridge");

const providerA = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const providerB = new ethers.JsonRpcProvider("http://127.0.0.1:8546");

const RELAYER_KEY       = process.env.RELAYER_KEY;
const LOCKBOX_ADDRESS   = process.env.LOCKBOX_ADDRESS;
const MINTBRIDGE_ADDRESS = process.env.MINTBRIDGE_ADDRESS;

const relayerWalletA = new ethers.Wallet(RELAYER_KEY, providerA);
const relayerWalletB = new ethers.Wallet(RELAYER_KEY, providerB);

const lockBox    = new ethers.Contract(LOCKBOX_ADDRESS, LockBoxABI, relayerWalletA);
const mintBridge = new ethers.Contract(MINTBRIDGE_ADDRESS, MintBridgeABI, relayerWalletB);

async function signAttestation(to, amount, nonce) {
  const message = ethers.solidityPackedKeccak256(
    ["address", "uint256", "uint256"],
    [to, amount, nonce]
  );
  // signMessage adds the "\x19Ethereum Signed Message" prefix automatically
  return relayerWalletB.signMessage(ethers.getBytes(message));
}

async function main() {
  const relayerAddr = relayerWalletB.address;
  console.log("=================================");
  console.log("Relayer started");
  console.log(`Relayer address : ${relayerAddr}`);
  console.log(`Listening on    : LockBox @ ${LOCKBOX_ADDRESS} (Chain A)`);
  console.log(`Submitting to   : MintBridge @ ${MINTBRIDGE_ADDRESS} (Chain B)`);
  console.log("=================================\n");

  lockBox.on("TokensLocked", async (sender, amount, nonce) => {
    console.log(`[Chain A] TokensLocked detected`);
    console.log(`  Sender : ${sender}`);
    console.log(`  Amount : ${ethers.formatEther(amount)} SRC`);
    console.log(`  Nonce  : ${nonce}`);

    try {
      const sig = await signAttestation(sender, amount, nonce);
      console.log(`[Relayer] Attestation signed: ${sig.slice(0, 20)}...`);

      const tx = await mintBridge.bridge(sender, amount, nonce, sig);
      const receipt = await tx.wait();
      console.log(`[Chain B] Mint successful! Tx: ${receipt.hash}`);
      console.log(`  Minted ${ethers.formatEther(amount)} wSRC to ${sender}\n`);
    } catch (err) {
      console.error("[Relayer] Error:", err.message);
    }
  });
}

main().catch(console.error);