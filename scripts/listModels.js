// scripts/listModels.js
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

async function main() {
  const contractPath = "./artifacts/contracts/vaultnet.sol/VaultNet.json";
  const vaultnetJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  const contractAddress = process.env.CONTRACT_ADDRESS;

  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(contractAddress, vaultnetJson.abi, provider);

  console.log("🔍 Fetching all models...\n");

  // Assuming modelCounter is public in the contract
  const totalModels = await contract.modelCounter();

  if (totalModels.toNumber() === 0) {
    console.log("⚠️ No models uploaded yet.");
    return;
  }

  console.log(`📦 Total Models: ${totalModels.toNumber()}\n`);
  console.log("──────────────────────────────────────────────────────────────────────────");
  console.log("ID | Name              | Uploader            | Price (ETH) | Version | CID");
  console.log("──────────────────────────────────────────────────────────────────────────");

  for (let i = 1; i <= totalModels; i++) {
    const model = await contract.models(i);
    if (!model.exists) continue;

    const name = model.name || "Unnamed";
    const price = ethers.utils.formatEther(model.price);
    const uploader = model.uploader.slice(0, 10) + "...";
    const shortCid = model.cid.slice(0, 8) + "...";

    console.log(`${i.toString().padEnd(2)} | ${name.padEnd(16)} | ${uploader.padEnd(20)} | ${price.padEnd(10)} | ${model.version.toString().padEnd(7)} | ${shortCid}`);
  }

  console.log("──────────────────────────────────────────────────────────────────────────");
}

main().catch((err) => console.error("❌ Error listing models:", err));
