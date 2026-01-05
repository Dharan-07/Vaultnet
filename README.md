# VaultNet / A Decentralized marketplace 

VaultNet is a simple Hardhat-based Ethereum project that implements a marketplace for uploading, purchasing, and updating models (stored as IPFS CIDs). It was created as a final-year project and includes smart contract logic, deployment scripts, helper utilities, and optional frontend integration.

> Important: Do NOT commit secrets (private keys, API keys, JWTs) to the repository. Store sensitive values in a local `.env` that is listed in `.gitignore`. Use a `.env.example` with placeholder values if you want to share variable names.

---

## Table of contents
- Project overview
- Features
- Contracts & key functions
- CREATE2 note (deterministic deployments)
- Project layout
- Environment variables (placeholders only)
- Quick start (local dev)
- Common scripts & commands
- addModel.mjs usage (file path note)
- Verify contract connectivity
- Frontend integration checklist
- Security & best practices
- Contributing
- License

---

## Project overview
VaultNet lets users upload model metadata (CID / URI) and set a price. Buyers can purchase models by sending ETH to the contract. Uploaders can later update the model (incrementing a version). The contract owner can change configuration and withdraw contract balance.

---

## Features
- Upload model metadata (CID) and set a price
- Purchase model using ETH with overpayment refund
- Uploader-only update of model CID and version bump
- Owner-only administrative functions (update manager address, withdraw funds)
- Deterministic deployment support via CREATE2 (optional, see note)

---

## Contracts & key functions
Main contract: `contracts/vaultnet.sol`

Important functions:
- uploadModel(string cid, uint256 price) => creates a Model entry and returns id
- buyModel(uint256 modelId) payable => transfers price to seller, refunds overpayment
- updateModel(uint256 modelId, string newCid) => uploader-only
- setFragmentManager(address) => owner-only (if used)
- withdraw(address payable to) => owner-only withdraw contract balance

Model struct fields:
- uploader, cid, price, version, exists

---

## CREATE2 note (deterministic deployments)
This project supports deterministic deployments using CREATE2 in deployment script(s). When CREATE2 is used, the contract address can be computed ahead of time and remains stable for the same deployer bytecode + salt. If you re-deploy without CREATE2, you must update the local contract address references (e.g., in your `.env` and frontend config).

If you are unfamiliar with CREATE2, read OpenZeppelin docs and verify your deploy script uses a deterministic salt / bytecode and that the script prints the final address.

---

## Project layout (typical)
- contracts/ — Solidity contracts (VaultNet)
- scripts/ — deployment and utility scripts (deploy.js, addModel.mjs, checkConnection.js, etc.)
- test/ — unit tests
- frontend/ — optional UI code
- artifacts/, cache/ — Hardhat build outputs
- node_modules/
- .env — local environment (DO NOT COMMIT)
- .env.example — placeholder variable names
- hardhat.config.js
- package.json
- README.md

---

## Environment variables (placeholders only)
Create a local `.env` (NOT committed) with the necessary values. Example names only — do not include real secrets in this file when publishing.

Example `.env` variables (placeholders):
- RPC_URL="https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
- PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
- CONTRACT_ADDRESS="0xYourDeployedContractAddress"   # optional if you deploy manually
- PINATA_API_KEY="your-pinata-key"                    # optional for IPFS uploads
- PINATA_API_SECRET="your-pinata-secret"              # optional

Add `.env` to `.gitignore`. Provide a `.env.example` with these names (empty values) to help collaborators.

---

## Quick start (local development)
1. Install dependencies
   - npm install

2. Compile
   - npx hardhat compile

3. Run tests
   - npx hardhat test

4. Start a local node (optional)
   - npx hardhat node

5. Deploy
   - npx hardhat run scripts/deploy.js --network <network>
   - If you use CREATE2, the deploy script may print the deterministic address; if not, copy the deployed address into your local `.env` as CONTRACT_ADDRESS.

---

## Common scripts & example commands
- Compile: npx hardhat compile
- Tests: npx hardhat test
- Local node: npx hardhat node
- Deploy (example): npx hardhat run scripts/deploy.js --network sepolia

Example: run a connection check script
- node scripts/checkConnection.js

(See scripts/ for additional utilities such as addModel.mjs)

---

## addModel.mjs usage (edit filePath)
The repo includes an `addModel.mjs` (or similar) helper script to upload example model metadata. That script may include a line like:
```js
// const filePath = path.resolve("assets/model-v1.json");
```
Before running the addModel script, update the filePath to point to the correct asset you want to upload, for example:
```js
const filePath = path.resolve("assets", "my-model.json");
```
Then run the script per its README or usage comments (it may require PINATA keys or an IPFS upload step).

---

## Verify contract connectivity
Create a small script to check your RPC and contract are reachable. Example `scripts/checkConnection.js`:

```javascript
// filepath: scripts/checkConnection.js
// ...existing code...
const { ethers } = require("ethers");
require("dotenv").config();

const RPC = process.env.RPC_URL;
const CONTRACT = process.env.CONTRACT_ADDRESS;

if (!RPC || !CONTRACT) {
  console.error("Missing RPC_URL or CONTRACT_ADDRESS in .env");
  process.exit(1);
}

const abi = [
  "function owner() view returns (address)",
  "function modelCounter() view returns (uint256)"
];

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const contract = new ethers.Contract(CONTRACT, abi, provider);
  console.log("Contract address:", CONTRACT);
  console.log("owner():", await contract.owner());
  console.log("modelCounter():", (await contract.modelCounter()).toString());
}

main().catch(err => { console.error(err); process.exit(1); });
```

Run:
```
node scripts/checkConnection.js
```

If the script returns an owner address and a numeric modelCounter, the contract is reachable by the configured RPC.

---

## Frontend integration checklist
- Use the same CONTRACT_ADDRESS and contract ABI in frontend config.
- Ensure providers/wallets (MetaMask) are on the same network as RPC_URL.
- For reads, use a provider (ethers.providers.JsonRpcProvider or web3 provider). For transactions, use an injected signer (MetaMask) or wallet connected via a secure signer.
- Watch the browser console and network tab for errors and revert messages.
- Never bake private keys into frontend code.

---

## Security & best practices
- Do not commit `.env` or any file containing secrets. Add to `.gitignore`.
- Keep private keys offline or in a secure secrets manager.
- Test on a testnet (Sepolia) before mainnet.
- Check for reentrancy and proper access control (nonReentrant and onlyOwner / onlyUploader are used in the contract).
- Consider unit tests for edge cases: overpayment refund, failed refunds, unauthorized updates, and withdraw access.

---

## Contributing
- Open issues for bugs or desired features.
- Send PRs with tests and clear descriptions.
- Keep changes minimal and well-documented.

---

##