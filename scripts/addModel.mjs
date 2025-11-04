import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import pinataSDK from "@pinata/sdk";

dotenv.config();

const { PINATA_API_KEY, PINATA_API_SECRET, CONTRACT_ADDRESS, PRIVATE_KEY, RPC_URL } = process.env;

// Ensure all required values are present
if (!PINATA_API_KEY || !PINATA_API_SECRET || !CONTRACT_ADDRESS || !PRIVATE_KEY || !RPC_URL) {
  console.error("❌ Missing one or more environment variables in .env file!");
  process.exit(1);
}

const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);

async function uploadToIPFS() {
  console.log("🔄 Uploading model to IPFS via Pinata...");

  // Path to your local model file
  const filePath = path.resolve("assets/model-v1.json");

  if (!fs.existsSync(filePath)) {
    throw new Error(`Model file not found at ${filePath}`);
  }

  // Create a readable stream (✅ Correct way for pinata SDK)
  const readableStream = fs.createReadStream(filePath);

  const options = {
    pinataMetadata: {
      name: "MyModel",
    },
    pinataOptions: {
      cidVersion: 0,
    },
  };

  const result = await pinata.pinFileToIPFS(readableStream, options);
  console.log(`✅ Model uploaded successfully! CID: ${result.IpfsHash}`);
  return result.IpfsHash;
}

async function main() {
  try {
    // Step 1: Upload to IPFS
    const cid = await uploadToIPFS();

    // Step 2: Connect to the Ethereum provider
    console.log("🚀 Connecting to VaultNet contract...");
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Step 3: Load ABI from compiled artifacts
    const abiPath = "./artifacts/contracts/vaultnet.sol/VaultNet.json";
    const artifact = JSON.parse(fs.readFileSync(abiPath));
    const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet);

    console.log("✅ Connected to VaultNet contract!");
    console.log(`📦 Adding model "MyModel" to VaultNet...`);

    // Step 4: Set price in Ether (as string)
    const priceInEther = "0.01";
    const priceInWei = ethers.utils.parseEther(priceInEther);

    // Step 5: Upload to contract
    const tx = await contract.uploadModel(cid, priceInWei);
    await tx.wait();

    console.log(`🎉 Model successfully added! Tx Hash: ${tx.hash}`);
  } catch (error) {
    console.error("❌ Error while adding model:", error);
  }
}

main();
