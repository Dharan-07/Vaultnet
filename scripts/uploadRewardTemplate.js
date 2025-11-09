import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pinataSDK from "@pinata/sdk";

dotenv.config();

// === CONFIG ===
const { PINATA_API_KEY, PINATA_API_SECRET } = process.env;
const TEMPLATE_PATH = path.resolve("assets/reward_template.json");

// === VALIDATION ===
if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  console.error("❌ Missing Pinata API credentials in .env file!");
  process.exit(1);
}

if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`❌ Reward template file not found at ${TEMPLATE_PATH}`);
  process.exit(1);
}

// === MAIN SCRIPT ===
const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);

async function uploadRewardTemplate() {
  console.log("🚀 Uploading reward template JSON to IPFS via Pinata...");

  const readableStream = fs.createReadStream(TEMPLATE_PATH);

  const options = {
    pinataMetadata: {
      name: "VaultNet_Reward_Template",
    },
    pinataOptions: {
      cidVersion: 0,
    },
  };

  try {
    const result = await pinata.pinFileToIPFS(readableStream, options);

    console.log("✅ Upload complete!");
    console.log(`📦 Template Name: ${options.pinataMetadata.name}`);
    console.log(`🆔 CID: ${result.IpfsHash}`);
    console.log(`🌐 Gateway URL: https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);

    // Save locally for reference
    fs.writeFileSync(
      "assets/reward_template_upload.json",
      JSON.stringify(
        {
          name: options.pinataMetadata.name,
          cid: result.IpfsHash,
          url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
          uploadedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log("💾 Metadata saved to assets/reward_template_upload.json");
  } catch (error) {
    console.error("❌ Error uploading reward template:", error);
  }
}

uploadRewardTemplate();

