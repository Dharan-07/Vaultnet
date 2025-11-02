const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Fragment collect + redeem flow", function () {
  let VaultToken, FragmentCollectible, CompleteCollectible, FragmentManager, VaultNet;
  let token, fragments, complete, manager, vaultnet;
  let deployer, alice;

  beforeEach(async () => {
    [deployer, alice] = await ethers.getSigners();

    VaultToken = await ethers.getContractFactory("VaultToken");
    token = await VaultToken.deploy(ethers.utils.parseUnits("1000000", 18));
    await token.deployed();

    FragmentCollectible = await ethers.getContractFactory("FragmentCollectible");
    fragments = await FragmentCollectible.deploy("https://example.com/{id}.json");
    await fragments.deployed();

    CompleteCollectible = await ethers.getContractFactory("CompleteCollectible");
    complete = await CompleteCollectible.deploy();
    await complete.deployed();

    FragmentManager = await ethers.getContractFactory("FragmentManager");
    manager = await FragmentManager.deploy(fragments.address, complete.address, token.address);
    await manager.deployed();

    // transfer ownership of fragment and complete contracts to manager so it can mint/burn and mint completes
    await fragments.transferOwnership(manager.address);
    await complete.transferOwnership(manager.address);

    // create template with 16 dummy fragment URIs and a final URI
    const fragURIs = [];
    for (let i = 0; i < 16; i++) {
      fragURIs.push(`ipfs://frag_template0_${i}`);
    }
    await manager.createTemplate("ipfs://final_template0", fragURIs);

    // deploy VaultNet with manager addr and reward template 0
    VaultNet = await ethers.getContractFactory("VaultNet");
    vaultnet = await VaultNet.deploy(manager.address, 0);
    await vaultnet.deployed();

    // set VaultNet as owner of manager actions (manager expects owner to call rewardFragment)
    // Actually manager.owner is deployer; we want onlyOwner on manager (we will set manager owner to deployer still),
    // so for demo, we will temporarily transfer manager ownership to deployer (by default) and allow manager rewardFragment to be called by owner (deployer).
    // To allow VaultNet to call reward, transfer manager ownership to deployer (already) then transfer to deployer? Actually manager.owner is deployer initially.
    // For demo we will let deployer call manager.rewardFragment through VaultNet: we need VaultNet to be owner or make manager.rewardFragment public onlyOwner.
    // Simpler: make manager.owner deployer, and then call rewardFragment directly in test to simulate VaultNet call.

    // For this test we will simulate the reward by calling manager.rewardFragment from deployer for alice.
  });

  it("awards fragments and redeems complete NFT", async function () {
    // simulate awarding all 16 fragments to alice
    for (let i = 0; i < 16; i++) {
      const tx = await manager.connect(deployer).rewardFragment(0, alice.address);
      await tx.wait();
    }

    // check alice owns all 16 fragments (token ids: 0*100 + idx)
    for (let i = 0; i < 16; i++) {
      const tid = 0 * 100 + i;
      // ERC1155 balanceOf
      const bal = await fragments.balanceOf(alice.address, tid);
      expect(bal.toNumber()).to.equal(1);
    }

    // prepare tokenIds and amounts arrays
    const ids = [];
    const amounts = [];
    for (let i = 0; i < 16; i++) {
      ids.push(0 * 100 + i);
      amounts.push(1);
    }

    // alice approves manager? For ERC1155 burnBatchFromOwner we coded manager to call _burnBatch requiring manager to be owner of FragmentCollectible.
    // But in our contract, burnBatchFromOwner is external and callable by manager (who is owner of fragment contract).
    // Now call redeem from alice
    await manager.connect(alice).redeem(0, ids, amounts);

    // check alice now owns a complete token (ERC721 id 0)
    expect(await complete.ownerOf(0)).to.equal(alice.address);
    const uri = await complete.tokenURI(0);
    expect(uri).to.equal("ipfs://final_template0");
  });
});

