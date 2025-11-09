import pkg from "hardhat";
const{ ethers } = pkg ;
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const { FRAGMENT_MANAGER } = process.env;
  const manager = await ethers.getContractAt("FragmentManager", FRAGMENT_MANAGER);
  const owner = await manager.owner();
  console.log("Current owner of FragmentManager:", owner);
}

main().catch((err) => console.error(err));
