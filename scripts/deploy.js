const hre = require("hardhat");

async function main() {
  console.log("\n🚀 Starting deterministic VaultNet deployment using CREATE2...\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await deployer.getBalance();

  console.log(`📍 Deployer address: ${deployer.address}`);
  console.log(`💰 Deployer balance: ${hre.ethers.utils.formatEther(balance)} ETH\n`);

  const VaultNetFactory = await hre.ethers.getContractFactory("VaultNet");

  // ✅ STEP 1: Deploy a small factory to use CREATE2
  const Factory = await hre.ethers.getContractFactory("Create2Factory");
  const factory = await Factory.deploy();
  await factory.deployed();
  console.log(`🏭 Factory deployed at: ${factory.address}`);

  // ✅ STEP 2: Generate deterministic salt
  const salt = hre.ethers.utils.id("VaultNet-Deployment"); // deterministic 32-byte value

  // ✅ STEP 3: Get bytecode for VaultNet
  const bytecode = VaultNetFactory.bytecode;

  // ✅ STEP 4: Compute predicted address
  const predictedAddress = await factory.computeAddress(salt, hre.ethers.utils.keccak256(bytecode));
  console.log(`🧩 Predicted VaultNet address: ${predictedAddress}`);

  // ✅ STEP 5: Deploy deterministically
  try {
    const tx = await factory.deploy(bytecode, salt);
    await tx.wait();
    console.log(`✅ VaultNet deployed at: ${predictedAddress}`);
  } catch (err) {
    console.error("❌ Deployment failed:", err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

