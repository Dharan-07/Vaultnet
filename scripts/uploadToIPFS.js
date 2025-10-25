// ✅ CommonJS-compatible version for Hardhat
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");
const pinataSDK = require("@pinata/sdk");
require("dotenv").config();

// Initialize Pinata
const pinata = new pinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_API_SECRET,
});

async function uploadFileToIPFS() {
  try {
    console.log("🚀 Uploading file to IPFS...");

    const filePath = path.join(__dirname, "../models/testModel.txt");
    const readableStreamForFile = fs.createReadStream(filePath);

    // Upload to Pinata
    const result = await pinata.pinFileToIPFS(readableStreamForFile, {
      pinataMetadata: {
        name: "VaultNetModel",
        keyvalues: {
          project: "VaultNet",
          type: "AI Model",
        },
      },
    });

    console.log("✅ File uploaded successfully!");
    console.log("📦 IPFS CID:", result.IpfsHash);

    // Store CID on blockchain
    await storeCIDOnBlockchain(result.IpfsHash);

  } catch (error) {
    console.error("❌ Error uploading file:", error);
  }
}

async function storeCIDOnBlockchain(cid) {
  try {
    console.log("\n🧠 Storing CID on blockchain...");

    const [deployer] = await ethers.getSigners();
    const vaultNet = await ethers.getContractAt(
      "VaultNet",
      "0x0F01f990972ddBbD0e6F9E1f2aC1808fd4d330B7"
    );

    // Example model info
    const name = "TestModel";
    const description = "AI Model test upload";
    const price = ethers.utils.parseEther("0.01");

    const tx = await vaultNet.uploadModel(name, description, cid, price);
    await tx.wait();

    console.log("✅ CID stored successfully on blockchain!");
  } catch (error) {
    console.error("❌ Error storing CID:", error);
  }
}

// Run the script
uploadFileToIPFS();

