// scripts/viewModel.js
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import readline from "readline";
import fs from "fs";
import open from "open";
dotenv.config();

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  const contractPath = "./artifacts/contracts/vaultnet.sol/VaultNet.json";
  const vaultnetJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  const contractAddress = process.env.CONTRACT_ADDRESS;

  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(contractAddress, vaultnetJson.abi, provider);

  const input = await ask("🔢 Enter Model ID to view: ");
  const modelId = parseInt(input);
  if (isNaN(modelId)) {
    console.error("❌ Invalid model ID");
    process.exit(1);
  }

  console.log(`\n🔍 Fetching model with ID: ${modelId} ...`);
  const model = await contract.models(modelId);

  if (!model.exists) {
    console.log("⚠️ Model not found or deleted.");
    return;
  }

  const name = model.name || "Unnamed Model";
  const description = model.description || "No description provided";
  const category = model.category || "Uncategorized";
  const timestamp = model.timestamp ? new Date(model.timestamp * 1000).toLocaleString() : "Unknown";

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

  const viewOption = await ask("🌐 Open model in browser? (y/n): ");
  if (viewOption.toLowerCase() === "y") {
    const url = `https://ipfs.io/ipfs/${model.cid}`;
    console.log(`🚀 Opening: ${url}`);
    await open(url);
  }
}

main().catch((err) => console.error("❌ Error viewing model:", err));
