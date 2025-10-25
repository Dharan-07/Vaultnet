// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Create2Factory {
    event Deployed(address addr, bytes32 salt);

    function deploy(bytes memory bytecode, bytes32 salt) public returns (address) {
        address addr;
        assembly {
            addr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(addr)) { revert(0, 0) }
        }
        emit Deployed(addr, salt);
        return addr;
    }

    function computeAddress(bytes32 salt, bytes32 bytecodeHash) public view returns (address) {
        return address(uint160(uint(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            bytecodeHash
        )))));
    }
}

