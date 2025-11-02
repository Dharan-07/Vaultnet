const hre = require("hardhat");

async function main() {
  await hre.run('compile'); // ensure compiled

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1) Deploy VaultToken
  const VaultToken = await hre.ethers.getContractFactory("VaultToken");
  const initialSupply = hre.ethers.utils.parseUnits("1000000", 18); // 1,000,000 tokens
  const vaultToken = await VaultToken.deploy(deployer.address, initialSupply);
  await vaultToken.deployed();
  console.log("VaultToken deployed:", vaultToken.address);

  // 2) Deploy FragmentCollectible & CompleteCollectible
  const FragmentCollectible = await hre.ethers.getContractFactory("FragmentCollectible");
  const CompleteCollectible = await hre.ethers.getContractFactory("CompleteCollectible");

  // Use an IPFS-style base URI by default (won't be interpreted as ENS)
  // Replace the placeholder with your real base CID: e.g. ipfs://bafy.../
  const baseUri = "ipfs://bafybeiexamplebaseuri/"; // <-- CHANGE THIS to your metadata base CID

  // constructors expect (address initialOwner, string baseURI)
  const fragment = await FragmentCollectible.deploy(deployer.address, baseUri);
  await fragment.deployed();
  console.log("FragmentCollectible deployed:", fragment.address);

  const complete = await CompleteCollectible.deploy(deployer.address, baseUri);
  await complete.deployed();
  console.log("CompleteCollectible deployed:", complete.address);

  // 3) Deploy FragmentManager (initialOwner = deployer for now)
  const FragmentManager = await hre.ethers.getContractFactory("FragmentManager");
  const fragmentManager = await FragmentManager.deploy(fragment.address, complete.address, vaultToken.address, deployer.address);
  await fragmentManager.deployed();
  console.log("FragmentManager deployed:", fragmentManager.address);

  // 4) Transfer ownership of fragment & complete to fragmentManager (so rewardFragment can mint)
  console.log("Transferring ownership of fragment and complete to FragmentManager...");
  let tx = await fragment.transferOwnership(fragmentManager.address);
  await tx.wait();
  tx = await complete.transferOwnership(fragmentManager.address);
  await tx.wait();
  console.log("Ownership transferred.");

  // 5) Deploy VaultNet (pass managerAddr, rewardTemplateId, initialOwner)
  const VaultNet = await hre.ethers.getContractFactory("VaultNet");
  const rewardTemplateId = 1; // set according to your templates created later
  const vaultNet = await VaultNet.deploy(fragmentManager.address, rewardTemplateId, deployer.address);
  await vaultNet.deployed();
  console.log("VaultNet deployed:", vaultNet.address);

  // 6) Transfer ownership of FragmentManager to VaultNet so VaultNet can call rewardFragment (which is onlyOwner)
  console.log("Transferring ownership of FragmentManager to VaultNet...");
  tx = await fragmentManager.transferOwnership(vaultNet.address);
  await tx.wait();
  console.log("FragmentManager owner is now VaultNet.");

  // Print addresses for your records:
  console.log("\n--- Deployed Contracts ---");
  console.log("VaultToken:", vaultToken.address);
  console.log("FragmentCollectible:", fragment.address);
  console.log("CompleteCollectible:", complete.address);
  console.log("FragmentManager:", fragmentManager.address);
  console.log("VaultNet:", vaultNet.address);
  console.log("--------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
