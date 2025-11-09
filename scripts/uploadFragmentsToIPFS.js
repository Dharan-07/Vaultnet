import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import pinataSDK from "@pinata/sdk";

dotenv.config();

// Load environment variables
const { PINATA_API_KEY, PINATA_API_SECRET } = process.env;

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  console.error("❌ Missing Pinata API credentials in .env file!");
  process.exit(1);
}

const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);

const FRAGMENTS_DIR = "assets/fragments"; // folder containing split images
const OUTPUT_JSON = "assets/fragments_manifest.json";

async function uploadFragments() {
  const files = fs.readdirSync(FRAGMENTS_DIR).filter(f => f.endsWith(".png"));
  if (files.length === 0) {
    console.error("❌ No .png fragments found in assets/fragments/");
    process.exit(1);
  }

  const uploaded = [];

  console.log(`🚀 Uploading ${files.length} fragments to IPFS via Pinata...`);

  for (const file of files) {
    const filePath = path.join(FRAGMENTS_DIR, file);
    const readableStream = fs.createReadStream(filePath);

    const result = await pinata.pinFileToIPFS(readableStream, {
      pinataMetadata: { name: file },
      pinataOptions: { cidVersion: 0 },
    });

    uploaded.push({
      name: file,
      cid: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    });

    console.log(`✅ ${file} uploaded! CID: ${result.IpfsHash}`);
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(uploaded, null, 2));
  console.log(`📦 Manifest saved to ${OUTPUT_JSON}`);
  console.log("✅ All fragments uploaded successfully!");
}

uploadFragments().catch(console.error);

