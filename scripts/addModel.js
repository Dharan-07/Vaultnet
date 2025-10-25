const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = "0xdB73d7dca98C15DB208bf6F3818a07E1c9189fc4";

  const modelName = "MyModel";
  const ipfsHash = "QmT9h4fXkB7vAq3XcdYtZ6oEJ1XcU7Z8kVFdjGh8N";
  const modelPrice = "0.01"; // in ETH

  console.log("🚀 Connecting to VaultNet contract on Sepolia...");

  const vaultNet = await hre.ethers.getContractAt("VaultNet", contractAddress);

  console.log(`✅ Connected to contract at: ${contractAddress}`);

  const priceInWei = hre.ethers.utils.parseEther(modelPrice);

  const [deployer] = await hre.ethers.getSigners(); // ✅ Get deployer account

  console.log(`📦 Uploading model: ${modelName}`);
  console.log(`📂 IPFS CID: ${ipfsHash}`);
  console.log(`💰 Price: ${modelPrice} ETH`);
  console.log(`👤 Owner: ${deployer.address}`);

  const tx = await vaultNet.uploadModel(modelName, ipfsHash, priceInWei, deployer.address);
  console.log("⏳ Transaction sent... waiting for confirmation...");

  await tx.wait();
  console.log(`✅ Model added successfully!`);
  console.log(`🔗 Tx Hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error("❌ Error adding model:", error);
  process.exitCode = 1;
});

