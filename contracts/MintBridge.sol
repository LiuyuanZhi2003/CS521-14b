// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./WrappedToken.sol";

contract MintBridge {
    WrappedToken public wrappedToken;
    address public relayer;

    event BridgeCompleted(address indexed to, uint256 amount, uint256 nonce);

    constructor(address _wrappedToken, address _relayer) {
        wrappedToken = WrappedToken(_wrappedToken);
        relayer = _relayer;
    }

    function bridge(
        address to,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(msg.sender == relayer, "Only relayer");
        wrappedToken.mint(to, amount, nonce, signature);
        emit BridgeCompleted(to, amount, nonce);
    }
}