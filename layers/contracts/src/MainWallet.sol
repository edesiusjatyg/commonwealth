// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract MainWallet {
    uint256 public amount;

    function deposit() public {
        this.balance += msg.value;
    }

    function withdraw(uint256 amount) public {
        this.balance -= amount;
    }
}