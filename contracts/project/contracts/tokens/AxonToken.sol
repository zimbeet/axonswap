// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AxonSwap Governance Token
/// @notice ERC20 governance token with minting capability for the AxonSwap protocol
contract AxonToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18; // 100M tokens

    constructor() ERC20("AxonSwap Token", "AXON") {
        // Mint initial supply to deployer
        _mint(msg.sender, MAX_SUPPLY);
    }

    /// @notice Burns tokens from caller's balance
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
