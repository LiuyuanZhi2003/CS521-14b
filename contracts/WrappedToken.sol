// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract WrappedToken {
    string public name = "Wrapped Source Token";
    string public symbol = "wSRC";
    uint8 public decimals = 18;

    address public relayer;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => bool) public processedNonces;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Minted(address indexed to, uint256 amount, uint256 nonce);
    event Burned(address indexed from, uint256 amount);

    constructor(address _relayer) {
        relayer = _relayer;
    }

    function mint(
        address to,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(!processedNonces[nonce], "Nonce already processed");
        require(_verify(to, amount, nonce, signature), "Invalid signature");

        processedNonces[nonce] = true;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
        emit Minted(to, amount, nonce);
    }

    function burn(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        emit Transfer(msg.sender, address(0), amount);
        emit Burned(msg.sender, amount);
    }

    function _verify(
        address to,
        uint256 amount,
        uint256 nonce,
        bytes memory sig
    ) internal view returns (bool) {
        bytes32 message = keccak256(abi.encodePacked(to, amount, nonce));
        bytes32 ethHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        return _recover(ethHash, sig) == relayer;
    }

    function _recover(bytes32 hash, bytes memory sig)
        internal pure returns (address)
    {
        require(sig.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        return ecrecover(hash, v, r, s);
    }
}