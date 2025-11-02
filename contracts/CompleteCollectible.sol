// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CompleteCollectible is ERC721URIStorage, Ownable {
    uint256 private _idCounter;
    string private _baseTokenURI;

    // NOTE: constructor argument order: (address initialOwner, string memory baseURI)
    constructor(address initialOwner, string memory baseURI) ERC721("CompleteCollectible", "COMP") {
        _baseTokenURI = baseURI;
        transferOwnership(initialOwner);
    }

    function mintTo(address to, string memory tokenURI) external onlyOwner returns (uint256) {
        _idCounter++;
        uint256 id = _idCounter;
        _safeMint(to, id);
        _setTokenURI(id, tokenURI);
        return id;
    }

    function setBaseURI(string memory newBase) external onlyOwner {
        _baseTokenURI = newBase;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
