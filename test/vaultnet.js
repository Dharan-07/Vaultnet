const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VaultNet", function () {
  let VaultNet, vaultnet, owner, addr1, addr2;

  beforeEach(async function () {
    VaultNet = await ethers.getContractFactory("VaultNet");
    [owner, addr1, addr2] = await ethers.getSigners();
    vaultnet = await VaultNet.deploy();
    await vaultnet.deployed();
  });

  it("should upload a model", async function () {
    await vaultnet.uploadModel("Model1", "Description1", "QmHash1", ethers.utils.parseEther("1"));
    const model = await vaultnet.getModel(0);
    expect(model[0]).to.equal("Model1");
    expect(model[2]).to.equal("QmHash1");
    expect(model[3]).to.equal(ethers.utils.parseEther("1"));
  });

  it("should allow user to buy access", async function () {
    await vaultnet.uploadModel("Model2", "Description2", "QmHash2", ethers.utils.parseEther("1"));
    await vaultnet.connect(addr1).buyAccess(0, { value: ethers.utils.parseEther("1") });
    expect(await vaultnet.checkAccess(0, addr1.address)).to.equal(true);
  });

  it("should update a model and track version", async function () {
    await vaultnet.uploadModel("Model3", "Description3", "QmHash3", ethers.utils.parseEther("1"));
    await vaultnet.updateModel(0, "QmHash3_v2");
    const model = await vaultnet.getModel(0);
    expect(model[2]).to.equal("QmHash3_v2");
    expect(model[5]).to.equal(2);
    const versions = await vaultnet.getModelVersionHistory(0);
    expect(versions.length).to.equal(2);
    expect(versions[1]).to.equal(2);
  });

  it("should not allow buying the same model twice", async function () {
    await vaultnet.uploadModel("Model4", "Description4", "QmHash4", ethers.utils.parseEther("1"));
    await vaultnet.connect(addr1).buyAccess(0, { value: ethers.utils.parseEther("1") });
    await expect(
      vaultnet.connect(addr1).buyAccess(0, { value: ethers.utils.parseEther("1") })
    ).to.be.revertedWith("Already purchased");
  });

  it("should not allow upload with zero price", async function () {
    await expect(
      vaultnet.uploadModel("Model5", "Description5", "QmHash5", 0)
    ).to.be.revertedWith("Price must be greater than 0");
  });

  it("should revert if non-owner tries to update model", async function () {
    await vaultnet.uploadModel("Model6", "Description6", "QmHash6", ethers.utils.parseEther("1"));
    await expect(
      vaultnet.connect(addr1).updateModel(0, "QmHash6_v2")
    ).to.be.revertedWith("Not the model owner");
  });
});

