pragma solidity ^0.7.3;

// SPDX-License-Identifier: UNLICENSED

import "../libraries/BEP20.sol";

contract BEP20Mock is BEP20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 supply
    ) BEP20(name, symbol) {
        _mint(msg.sender, supply);

    }
}