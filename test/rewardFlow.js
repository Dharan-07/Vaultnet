const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VaultNet Reward Flow", function () {
  let owner, user;
  let vaultToken, fragment, complete, manager, vaultnet;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // 1️⃣ Deploy VaultToken
    const VaultToken = await ethers.getContractFactory("VaultToken");
    vaultToken = await VaultToken.deploy(owner.address, ethers.utils.parseUnits("1000000", 18));

    // 2️⃣ Deploy FragmentCollectible & CompleteCollectible
    const FragmentCollectible = await ethers.getContractFactory("FragmentCollectible");
    const CompleteCollectible = await ethers.getContractFactory("CompleteCollectible");

    const baseUri = "ipfs://test-base-uri/";
    fragment = await FragmentCollectible.deploy(owner.address, baseUri);
    complete = await CompleteCollectible.deploy(owner.address, baseUri);

    // 3️⃣ Deploy FragmentManager
    const FragmentManager = await ethers.getContractFactory("FragmentManager");
    manager = await FragmentManager.deploy(fragment.address, complete.address, vaultToken.address, owner.address);

    // Transfer ownerships so manager can mint
    await fragment.transferOwnership(manager.address);
    await complete.transferOwnership(manager.address);

    // 4️⃣ Deploy VaultNet
    const VaultNet = await ethers.getContractFactory("VaultNet");
    vaultnet = await VaultNet.deploy(manager.address, 1, owner.address);

    // Transfer manager ownership to VaultNet
    await manager.transferOwnership(vaultnet.address);
  });

  it("should reward fragment NFT to uploader when uploading model", async () => {
    // ✅ user uploads model
    const price = ethers.utils.parseEther("0.01");
    const tx = await vaultnet.connect(user).uploadModel("ipfs://testCID", price);
    await tx.wait();

    // model count = 1
    const model = await vaultnet.models(1);
    expect(model.uploader).to.equal(user.address);

    // ✅ Verify reward fragment minted to uploader
    const balance = await fragment.balanceOf(user.address);
    expect(balance).to.equal(1);
  });
});

