const { spawn } = require("child_process");
const path = require("path");

console.log("Starting Chain B on port 8546...");

const node = spawn(
  "npx",
  ["hardhat", "node", "--port", "8546"],
  {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    shell: true,
  }
);

node.on("close", (code) => {
  console.log(`Chain B exited with code ${code}`);
});