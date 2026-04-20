const { spawn } = require("child_process");
const path = require("path");

console.log("Starting Chain A on port 8545...");

const node = spawn(
  "npx",
  ["hardhat", "node", "--port", "8545"],
  {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    shell: true,
  }
);

node.on("close", (code) => {
  console.log(`Chain A exited with code ${code}`);
});