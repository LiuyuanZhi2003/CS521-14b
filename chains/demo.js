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

const SourceTokenABI   = loadABI("SourceToken");
const LockBoxABI       = loadABI("LockBox");
const WrappedTokenABI  = loadABI("WrappedToken");

const providerA = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const providerB = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8546");

const {
  USER_KEY,
  LOCKBOX_ADDRESS,
  SOURCETOKEN_ADDRESS,
  WRAPPEDTOKEN_ADDRESS,
} = process.env;

async function main() {
  const userA = new ethers.Wallet(USER_KEY, providerA);
  const userB = new ethers.Wallet(USER_KEY, providerB);

  const sourceToken  = new ethers.Contract(SOURCETOKEN_ADDRESS, SourceTokenABI, userA);
  const lockBox      = new ethers.Contract(LOCKBOX_ADDRESS, LockBoxABI, userA);
  const wrappedToken = new ethers.Contract(WRAPPEDTOKEN_ADDRESS, WrappedTokenABI, userB);

  const AMOUNT = ethers.utils.parseEther("100");

  console.log("=== Bridge Demo ===\n");

  const srcBefore = await sourceToken.balanceOf(userA.address);
  const wBefore   = await wrappedToken.balanceOf(userB.address);
  console.log(`[Before] SRC  on Chain A: ${ethers.utils.formatEther(srcBefore)}`);
  console.log(`[Before] wSRC on Chain B: ${ethers.utils.formatEther(wBefore)}\n`);

  console.log("Step 1: Approving LockBox to spend 100 SRC...");
  const approveTx = await sourceToken.approve(LOCKBOX_ADDRESS, AMOUNT);
  await approveTx.wait();
  console.log("Approved.\n");

  console.log("Step 2: Locking 100 SRC on Chain A...");
  const lockTx = await lockBox.lock(AMOUNT);
  await lockTx.wait();
  console.log("Tokens locked. Waiting for relayer...\n");

  await new Promise(resolve => setTimeout(resolve, 5000));

  const srcAfter = await sourceToken.balanceOf(userA.address);
  const wAfter   = await wrappedToken.balanceOf(userB.address);
  console.log(`[After]  SRC  on Chain A: ${ethers.utils.formatEther(srcAfter)}`);
  console.log(`[After]  wSRC on Chain B: ${ethers.utils.formatEther(wAfter)}\n`);

  if (wAfter.gt(wBefore)) {
    console.log("✓ Bridge successful!");
  } else {
    console.log("Relayer may still be processing, check relayer terminal.");
  }
}

main().catch(console.error);