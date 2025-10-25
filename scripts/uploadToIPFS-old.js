import pinataSDK from "@pinata/sdk";
import path from "path";
import dotenv from "dotenv";
const fs = require("fs");
const path = require("path");

dotenv.config();

// Initialize Pinata
const pinata = new pinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_API_SECRET,
});

async function main() {
  try {
    // Upload file from 'models' folder
    const filePath = path.join(process.cwd(), "models", "testModel.txt");
    const readableStreamForFile = fs.createReadStream(filePath);

    console.log("🚀 Uploading file to IPFS...");

    const result = await pinata.pinFileToIPFS(readableStreamForFile, {
      pinataMetadata: {
        name: "VaultNetModel",
        keyvalues: { project: "VaultNet", type: "AI Model" },
      },
    });

    const cid = result.IpfsHash;
    console.log("✅ File uploaded successfully!");
    console.log("📦 IPFS CID:", cid);

    // ---------------------
    // Connect to blockchain
    // ---------------------
    console.log("\n🧠 Storing CID on blockchain...");

    const [deployer] = await ethers.getSigners();
    const contractAddress = "0x7Bdbb8c360686930aDDB2Ecef12d046242F4B86E"; // ⚠️ replace this
    const vaultNet = await ethers.getContractAt("VaultNet", contractAddress);

    // Upload model with 4 arguments (match Solidity function)
    const tx = await vaultNet.uploadModel(
      "VaultNet Test Model",         // name
      "Sample model uploaded via IPFS", // description
      cid,                           // IPFS CID
      ethers.utils.parseEther("0.01") // price
    );

    await tx.wait();
    console.log("✅ CID successfully stored on-chain!");
    console.log(`🔗 Transaction hash: ${tx.hash}`);

  } catch (error) {
    console.error("❌ Error storing CID:", error);
  }
}

main();

