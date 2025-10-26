const path = require("path");
const fs = require("fs");

// Simulate the path resolution from the escrow service
const ESCROW_ARTIFACT_PATH = path.join(
  process.cwd(),
  "hedera-escrow/artifacts/contracts/Escrow.sol/Escrow.json"
);

console.log("Current working directory:", process.cwd());
console.log("Artifact path:", ESCROW_ARTIFACT_PATH);
console.log("Artifact exists:", fs.existsSync(ESCROW_ARTIFACT_PATH));

if (fs.existsSync(ESCROW_ARTIFACT_PATH)) {
  console.log("✅ Artifact file found!");
  const artifact = JSON.parse(fs.readFileSync(ESCROW_ARTIFACT_PATH, "utf-8"));
  console.log("✅ Artifact is valid JSON");
  console.log("   Has abi:", !!artifact.abi);
  console.log("   Has bytecode:", !!artifact.bytecode);
} else {
  console.log("❌ Artifact file NOT found!");
  console.log("Expected location:", ESCROW_ARTIFACT_PATH);

  // Check if the directory exists
  const dir = path.dirname(ESCROW_ARTIFACT_PATH);
  console.log("Directory exists:", fs.existsSync(dir));

  if (fs.existsSync(dir)) {
    console.log("Contents of directory:", fs.readdirSync(dir));
  }
}
