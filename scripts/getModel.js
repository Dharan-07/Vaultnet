// scripts/getModel.js
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import readline from "readline";
import fs from "fs";
dotenv.config();

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  // Load contract ABI + address
  const contractPath = "./artifacts/contracts/vaultnet.sol/VaultNet.json";
  const vaultnetJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  const contractAddress = process.env.CONTRACT_ADDRESS;

  // Ask for model ID
  const input = await ask("🔢 Enter Model ID to fetch: ");
  const modelId = parseInt(input);
  if (isNaN(modelId)) {
    console.error("❌ Invalid model ID");
    process.exit(1);
  }

  // Setup provider and contract
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(contractAddress, vaultnetJson.abi, provider);

  console.log(`\n🔍 Fetching model with ID: ${modelId} ...`);

  // ✅ Fetch model struct
  const model = await contract.models(modelId);

  if (!model.exists) {
    console.log("⚠️ Model not found or deleted.");
    return;
  }

  // Optional fields depending on your contract
  let name = model.name || "Unnamed Model";
  let description = model.description || "No description provided";
  let category = model.category || "Uncategorized";
  let timestamp = model.timestamp ? new Date(model.timestamp * 1000).toLocaleString() : "Unknown";

  console.log(`
✅ Model Details:
───────────────────────────────
📦 Model ID   : ${modelId}
🧩 Name        : ${name}
🧠 Description : ${description}
🏷️ Category    : ${category}
👤 Uploader    : ${model.uploader}
🧾 CID         : ${model.cid}
💰 Price       : ${ethers.utils.formatEther(model.price)} ETH
🔢 Version     : ${model.version}
📅 Uploaded On : ${timestamp}
───────────────────────────────
  `);

  // ✅ Optionally, show version history if available
  try {
    const versions = await contract.getModelVersions(modelId);
    if (versions.length > 0) {
      console.log("📜 Version History:");
      versions.forEach((v, i) => {
        console.log(`   • Version ${i + 1}: CID ${v.cid}, Uploaded: ${new Date(v.timestamp * 1000).toLocaleString()}`);
      });
    }
  } catch (err) {
    console.log("ℹ️ No version history available or function not implemented.");
  }
}

main().catch((err) => {
  console.error("❌ Error fetching model:", err);
});
