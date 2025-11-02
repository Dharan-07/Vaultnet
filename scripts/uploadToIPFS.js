// scripts/uploadToIPFS.js
// CommonJS-compatible version for Hardhat (drop-in replacement)

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");
const pinataSDK = require("@pinata/sdk");
require("dotenv").config();

async function main() {
  console.log("🚀 Starting uploadToIPFS.js");

  // --- ENV checks ---
  const PINATA_API_KEY = process.env.PINATA_API_KEY || "";
  const PINATA_API_SECRET = process.env.PINATA_API_SECRET || "";
  const PINATA_JWT = process.env.PINATA_JWT || "";
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
  const FILE_PATHS = [
    path.join(__dirname, "../models/testModel.txt"),
    path.join(__dirname, "../models/model.txt"),
    path.join(process.cwd(), "models/testModel.txt"),
    path.join(process.cwd(), "models/model.txt"),
    path.join(process.cwd(), "files/model.txt"),
  ];

  if (!CONTRACT_ADDRESS) {
    console.error("❌ CONTRACT_ADDRESS not set in .env. Set CONTRACT_ADDRESS to your deployed VaultNet address.");
    process.exit(1);
  }

  if (!PINATA_API_KEY && !PINATA_JWT) {
    console.error("❌ Pinata credentials not found. Set PINATA_API_KEY + PINATA_API_SECRET or PINATA_JWT in .env");
    process.exit(1);
  }

  // choose first existing file from candidates
  let filePath = null;
  for (const p of FILE_PATHS) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }
  if (!filePath) {
    console.error("❌ No upload file found. Tried:", FILE_PATHS.join(", "));
    console.error("Put the file you want to upload in models/testModel.txt (or models/model.txt) and retry.");
    process.exit(1);
  }

  // --- init Pinata (support both API keys and JWT) ---
  let pinata;
  if (PINATA_JWT) {
    // pinataSDK supports passing a single JWT string as first arg in older usage;
    // we'll construct with API keys if given, else use JWT in headers via pinFileToIPFS options.
    pinata = pinataSDK(PINATA_API_KEY || "", PINATA_API_SECRET || "");
  } else {
    pinata = pinataSDK({
      pinataApiKey: PINATA_API_KEY,
      pinataSecretApiKey: PINATA_API_SECRET,
    });
  }

  try {
    console.log("🚀 Uploading file to IPFS...");
    const readableStreamForFile = fs.createReadStream(filePath);

    // If JWT present, use it in request options (pinataSDK pinFileToIPFS will use API keys by default)
    const pinOptions = {};
    if (PINATA_JWT) {
      // pinataSDK doesn't take JWT directly in pinFileToIPFS options; but many setups use API keys.
      // If you must use JWT only, consider swapping to direct HTTP request. Here we attempt API key route.
      // If you rely on JWT only and upload fails, please set PINATA_API_KEY and PINATA_API_SECRET.
    }

    const result = await pinata.pinFileToIPFS(readableStreamForFile, {
      pinataMetadata: {
        name: path.basename(filePath),
        keyvalues: { project: "VaultNet", source: "uploadToIPFS.js" },
      },
      ...pinOptions,
    });

    const cid = result && (result.IpfsHash || result.IpfsHash === "undefined" ? result.IpfsHash : result.ipfsHash);
    if (!cid) {
      console.error("❌ Pinata upload returned unexpected result:", result);
      process.exit(1);
    }

    console.log("✅ File uploaded successfully!");
    console.log("📦 IPFS CID:", cid);

    // --- store CID on-chain ---
    console.log("\n🧠 Storing CID on blockchain...");

    // Use Hardhat's signers to connect (works during `npx hardhat run`)
    const [deployer] = await ethers.getSigners();
    console.log("📍 Using deployer:", deployer.address);

    // Load ABI from artifact (make sure contract compiled)
    const artifactPath = path.join(__dirname, "../artifacts/contracts/vaultnet.sol/VaultNet.json");
    if (!fs.existsSync(artifactPath)) {
      console.error("❌ ABI artifact not found at", artifactPath);
      console.error("Run `npx hardhat compile` first.");
      process.exit(1);
    }
    const contractJSON = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const contractABI = contractJSON.abi;

    const vaultNet = await ethers.getContractAt(contractABI, CONTRACT_ADDRESS, deployer);

    // Price example, adjust if you want (contract expects uint256 price second param)
    const price = ethers.utils.parseEther("0.01"); // 0.01 ETH as example

    // IMPORTANT: contract signature is uploadModel(string cid, uint256 price)
    const tx = await vaultNet.uploadModel(cid, price);
    const receipt = await tx.wait();

    console.log("✅ CID stored successfully on blockchain!");
    console.log("🔗 CID:", cid);
    console.log("🧾 Transaction hash:", receipt.transactionHash);
    console.log("📡 Block number:", receipt.blockNumber);
  } catch (err) {
    console.error("❌ Error during upload/store:", err);
    process.exit(1);
  }
}

// run
main();
