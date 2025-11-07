// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFragmentManager {
    function rewardFragment(address to, string memory tokenURI) external returns (uint256);
}

contract VaultNet is Ownable, ReentrancyGuard {
    struct Model {
        address uploader;
        string cid; // IPFS CID or metadata URI
        uint256 price; // price in wei
        uint256 version;
        bool exists;
    }

    mapping(uint256 => Model) public models;
    uint256 public modelCounter;

    IERC20 public vaultToken;
    IFragmentManager public fragmentManager;
    uint256 public rewardTemplateId;

    event ModelUploaded(uint256 indexed modelId, address indexed uploader, string cid, uint256 price);
    event ModelPurchased(uint256 indexed modelId, address indexed buyer, uint256 price);
    event ModelUpdated(uint256 indexed modelId, string newCid, uint256 newVersion);

    constructor(address managerAddr, uint256 _rewardTemplateId, address initialOwner) {
        fragmentManager = IFragmentManager(managerAddr);
        rewardTemplateId = _rewardTemplateId;
        transferOwnership(initialOwner);
    }

    modifier onlyUploader(uint256 modelId) {
        require(models[modelId].uploader == msg.sender, "not uploader");
        _;
    }

    function uploadModel(string memory cid, uint256 price) external returns (uint256) {
    modelCounter++;
    uint256 id = modelCounter;
    models[id] = Model({
        uploader: msg.sender,
        cid: cid,
        price: price,
        version: 1,
        exists: true
    });

    emit ModelUploaded(id, msg.sender, cid, price);

    // 🎁 Reward uploader with a fragment NFT
    try fragmentManager.rewardFragment(msg.sender, cid) returns (uint256 tokenId) {
        // optionally emit event for tracking
        // emit FragmentRewarded(msg.sender, tokenId);
    } catch {
        // if reward mint fails, do not revert the upload
    }

    return id;
}


    function buyModel(uint256 modelId) external payable nonReentrant {
        require(models[modelId].exists, "model not found");
        uint256 price = models[modelId].price;
        require(msg.value >= price, "insufficient funds");

        address payable seller = payable(models[modelId].uploader);
        (bool sent, ) = seller.call{value: price}("");
        require(sent, "transfer failed");

        emit ModelPurchased(modelId, msg.sender, price);

        if (msg.value > price) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(refunded, "refund failed");
        }
    }

    function updateModel(uint256 modelId, string memory newCid) external onlyUploader(modelId) {
        require(models[modelId].exists, "model not found");
        models[modelId].cid = newCid;
        models[modelId].version += 1;
        emit ModelUpdated(modelId, newCid, models[modelId].version);
    }

    function setFragmentManager(address newManager) external onlyOwner {
        fragmentManager = IFragmentManager(newManager);
    }

    function withdraw(address payable to) external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "no balance");
        (bool ok, ) = to.call{value: balance}("");
        require(ok, "withdraw failed");
    }
}
