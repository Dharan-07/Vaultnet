// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FragmentCollectible is ERC1155URIStorage, Ownable {
    uint256 private _currentId;

    constructor(string memory uri_, address initialOwner) ERC1155(uri_) Ownable(initialOwner) {}


    function mint(address to, string memory uri) external onlyOwner returns (uint256) {
        uint256 id = _currentId++;
        _mint(to, id, 1, "");
        _setURI(id, uri);
        return id;
    }
}

