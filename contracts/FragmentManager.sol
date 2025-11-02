// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFragmentCollectible {
    function mintTo(address to, string memory tokenURI) external returns (uint256);
}

interface ICompleteCollectible {
    function mintTo(address to, string memory tokenURI) external returns (uint256);
}

contract FragmentManager is Ownable {
    IFragmentCollectible public fragment;
    ICompleteCollectible public complete;
    IERC20 public vaultToken;

    event FragmentMinted(address indexed to, uint256 id, string uri);
    event CompleteMinted(address indexed to, uint256 id, string uri);

    constructor(address fragmentAddr, address completeAddr, address tokenAddr, address initialOwner) {
        fragment = IFragmentCollectible(fragmentAddr);
        complete = ICompleteCollectible(completeAddr);
        vaultToken = IERC20(tokenAddr);
        transferOwnership(initialOwner);
    }

    function rewardFragment(address to, string memory tokenURI) external onlyOwner returns (uint256) {
        uint256 id = fragment.mintTo(to, tokenURI);
        emit FragmentMinted(to, id, tokenURI);
        return id;
    }

    function rewardComplete(address to, string memory tokenURI) external onlyOwner returns (uint256) {
        uint256 id = complete.mintTo(to, tokenURI);
        emit CompleteMinted(to, id, tokenURI);
        return id;
    }
}
