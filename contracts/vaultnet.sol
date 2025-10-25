// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VaultNet
 * @dev A decentralized repository for storing, buying, and updating AI models with IPFS integration.
 *      Models are identified by their IPFS CID and include version control.
 */
contract VaultNet {
    struct Model {
        string name;
        string description;
        string ipfsHash; // IPFS CID
        uint256 price;
        address owner;
        uint256 version;
        uint256[] versionHistory;
    }

    uint256 public modelCounter;
    mapping(uint256 => Model) public models;
    mapping(address => mapping(uint256 => bool)) public hasAccess;

    // ----------------- EVENTS -----------------
    event ModelUploaded(uint256 indexed modelId, address indexed owner, string name, uint256 price, string ipfsHash);
    event ModelPurchased(uint256 indexed modelId, address indexed buyer);
    event ModelUpdated(uint256 indexed modelId, string newIpfsHash, uint256 newVersion);
    event CIDStored(uint256 indexed modelId, string cid, address indexed storedBy);

    // ----------------- MODIFIERS -----------------
    modifier onlyOwner(uint256 modelId) {
        require(models[modelId].owner == msg.sender, "Not the model owner");
        _;
    }

    modifier modelExists(uint256 modelId) {
        require(modelId < modelCounter, "Model does not exist");
        _;
    }

    // ----------------- CORE FUNCTIONS -----------------

    /**
     * @notice Uploads a new model to VaultNet.
     * @param name Model name
     * @param description Short description of the model
     * @param ipfsHash IPFS CID of the model
     * @param price Price in wei
     */
    function uploadModel(
        string memory name,
        string memory description,
        string memory ipfsHash,
        uint256 price
    ) public {
        require(price > 0, "Price must be greater than 0");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");

        Model storage newModel = models[modelCounter];
        newModel.name = name;
        newModel.description = description;
        newModel.ipfsHash = ipfsHash;
        newModel.price = price;
        newModel.owner = msg.sender;
        newModel.version = 1;
        newModel.versionHistory.push(1);

        emit ModelUploaded(modelCounter, msg.sender, name, price, ipfsHash);
        modelCounter++;
    }

    /**
     * @notice Allows a user to buy access to a model.
     * @param modelId The ID of the model
     */
    function buyAccess(uint256 modelId) public payable modelExists(modelId) {
        Model storage model = models[modelId];
        require(msg.value >= model.price, "Insufficient payment");
        require(!hasAccess[msg.sender][modelId], "Already purchased");

        hasAccess[msg.sender][modelId] = true;
        payable(model.owner).transfer(model.price);

        emit ModelPurchased(modelId, msg.sender);
    }

    /**
     * @notice Updates an existing model with a new version (new IPFS CID).
     * @param modelId The ID of the model
     * @param newIpfsHash The new IPFS CID
     */
    function updateModel(uint256 modelId, string memory newIpfsHash)
        public
        onlyOwner(modelId)
        modelExists(modelId)
    {
        require(bytes(newIpfsHash).length > 0, "New IPFS hash required");

        Model storage model = models[modelId];
        model.version++;
        model.ipfsHash = newIpfsHash;
        model.versionHistory.push(model.version);

        emit ModelUpdated(modelId, newIpfsHash, model.version);
    }

    // ----------------- IPFS UTILITY FUNCTIONS -----------------

    /**
     * @notice Store or update the CID for an existing model (used by external scripts).
     * @param modelId ID of the model
     * @param cid IPFS CID to store
     */
    function storeCID(uint256 modelId, string memory cid) public onlyOwner(modelId) modelExists(modelId) {
        require(bytes(cid).length > 0, "CID cannot be empty");

        models[modelId].ipfsHash = cid;
        emit CIDStored(modelId, cid, msg.sender);
    }

    /**
     * @notice Fetch the IPFS CID for a given model.
     * @param modelId ID of the model
     * @return cid IPFS hash string
     */
    function getModelCID(uint256 modelId) public view modelExists(modelId) returns (string memory cid) {
        return models[modelId].ipfsHash;
    }

    // ----------------- VIEW FUNCTIONS -----------------

    /**
     * @notice Returns model details by ID.
     */
    function getModel(uint256 modelId)
        public
        view
        modelExists(modelId)
        returns (
            string memory,
            string memory,
            string memory,
            uint256,
            address,
            uint256
        )
    {
        Model memory model = models[modelId];
        return (
            model.name,
            model.description,
            model.ipfsHash,
            model.price,
            model.owner,
            model.version
        );
    }

    /**
     * @notice Checks if a user has purchased access to a specific model.
     */
    function checkAccess(uint256 modelId, address user) public view returns (bool) {
        return hasAccess[user][modelId];
    }

    /**
     * @notice Returns all version numbers of a specific model.
     */
    function getModelVersionHistory(uint256 modelId)
        public
        view
        modelExists(modelId)
        returns (uint256[] memory)
    {
        return models[modelId].versionHistory;
    }

    /**
     * @notice Returns total number of models uploaded.
     */
    function getTotalModels() public view returns (uint256) {
        return modelCounter;
    }

    /**
     * @notice Returns the latest uploaded model ID.
     */
    function getLatestModelId() public view returns (uint256) {
        require(modelCounter > 0, "No models exist");
        return modelCounter - 1;
    }
}

