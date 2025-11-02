// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FragmentManager.sol";

contract VaultNet is Ownable, ReentrancyGuard {
    struct Model {
        string name;
        string ipfsHash;
        address creator;
        uint256 price;
        uint256 version;
        bool active;
    }

    FragmentManager public fragmentManager;
    uint256 public rewardTemplateId;
    mapping(uint256 => Model) public models;
    mapping(address => uint256[]) public userModels;
    uint256 public modelCounter;

   constructor(address managerAddr, uint256 _rewardTemplateId, address initialOwner)
    Ownable(initialOwner)
{
    fragmentManager = FragmentManager(managerAddr);
    rewardTemplateId = _rewardTemplateId;
}



    event ModelUploaded(address indexed creator, uint256 indexed modelId);
    event ModelPurchased(address indexed buyer, uint256 indexed modelId, uint256 price);

    function uploadModel(string memory name, string memory ipfsHash) external nonReentrant {
        uint256 id = modelCounter++;
        models[id] = Model(name, ipfsHash, msg.sender, 0, 1, true);
        userModels[msg.sender].push(id);
        emit ModelUploaded(msg.sender, id);

        fragmentManager.rewardFragment(msg.sender, rewardTemplateId);
    }

    function updateModel(uint256 modelId, string memory newHash) external nonReentrant {
        Model storage m = models[modelId];
        require(m.creator == msg.sender, "Not creator");
        require(m.active, "Inactive");

        m.ipfsHash = newHash;
        m.version += 1;
    }

    function buyModel(uint256 modelId) external payable nonReentrant {
        Model storage m = models[modelId];
        require(m.active, "Inactive");
        require(msg.value >= m.price, "Low funds");
        payable(m.creator).transfer(m.price);

        fragmentManager.rewardFragment(msg.sender, rewardTemplateId);
        emit ModelPurchased(msg.sender, modelId, m.price);
    }

    function setModelPrice(uint256 modelId, uint256 newPrice) external {
        Model storage m = models[modelId];
        require(m.creator == msg.sender, "Not creator");
        m.price = newPrice;
    }
}

