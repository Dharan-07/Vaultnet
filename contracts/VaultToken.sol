// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VaultToken is ERC20, Ownable {
    constructor(address initialAccount, uint256 initialSupply) ERC20("VaultToken", "VTK") {
        _mint(initialAccount, initialSupply);
        transferOwnership(initialAccount);
    }
}
