// scripts/uploadAndStoreCID.js
// Usage: node scripts/uploadAndStoreCID.js ./models/testModel.txt "Model Name" "Model description" 0.01
// scripts/uploadAndStoreCID.mjs
import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
import pinataSDK from "@pinata/sdk";

dotenv.config();

// --- CONFIG ---
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Wallet to send tx
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; // VaultNet deployed contract
const ABI = JSON.parse(fs.readFileSync('./artifacts/contracts/VaultNet.sol/VaultNet.json')).abi;

// --- ARGS ---
const args = process.argv.slice(2);
if (args.length < 4) {
    console.log("Usage: node uploadAndStoreCID.mjs <filePath> <name> <description> <price>");
    process.exit(1);
}

const [filePath, name, description, price] = args;

// --- INIT Pinata ---
const pinata = pinataSDK(PINATA_API_KEY, PINATA_SECRET_API_KEY);

async function uploadToIPFS() {
    try {
        const readableStream = fs.createReadStream(filePath);

        const result = await pinata.pinFileToIPFS(readableStream, {
            pinataMetadata: {
                name,
                keyvalues: { description }
            },
            pinataOptions: { cidVersion: 1 }
        });

        console.log("✅ Uploaded to IPFS! CID:", result.IpfsHash);
        return result.IpfsHash;
    } catch (err) {
        console.error("❌ IPFS upload failed:", err);
        process.exit(1);
    }
}

async function storeCIDInContract(cid) {
    try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL); // e.g., localhost:8545
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

        const tx = await contract.uploadModel(
            name,
            description,
            cid,
            ethers.utils.parseEther(price) // convert price to wei
        );

        console.log("⏳ Transaction sent, waiting for confirmation...");
        await tx.wait();
        console.log("✅ CID stored in VaultNet contract!");
    } catch (err) {
        console.error("❌ Failed to store CID in contract:", err);
        process.exit(1);
    }
}

async function main() {
    const cid = await uploadToIPFS();
    await storeCIDInContract(cid);
}

main();

