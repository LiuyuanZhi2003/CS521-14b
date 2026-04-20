// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SourceToken.sol";

contract LockBox {
    address public owner;
    SourceToken public token;
    uint256 public nonce;

    event TokensLocked(
        address indexed sender,
        uint256 amount,
        uint256 nonce
    );

    constructor(address _token) {
        owner = msg.sender;
        token = SourceToken(_token);
    }

    function lock(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        token.transferFrom(msg.sender, address(this), amount);
        nonce++;
        emit TokensLocked(msg.sender, amount, nonce);
    }

    // Called when user bridges back: relayer submits burn proof, we release
    function unlock(address to, uint256 amount) external {
        require(msg.sender == owner, "Only owner/relayer");
        token.transfer(to, amount);
    }

    function lockedBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}