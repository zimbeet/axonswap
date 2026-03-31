// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.6.0;

/// @title TransferHelper
/// @notice Contains helper methods for interacting with ERC20 tokens that do not consistently return true/false
library TransferHelper {
    /// @notice Transfers tokens from msg.sender to a recipient
    /// @dev Calls transfer on token contract, errors with TF if transfer fails
    /// @param token The contract address of the token which will be transferred
    /// @param to The recipient of the transfer
    /// @param value The value of the transfer
    function safeTransfer(
        address token,
        address to,
        uint256 value
    ) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(bytes4(keccak256("transfer(address,uint256)")), to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TF');
    }

    /// @notice Transfers tokens from the targeted address to the given destination
    /// @dev Calls transferFrom on token contract, errors with STF if transfer fails
    /// @param token The contract address of the token to be transferred
    /// @param from The originating address from which the tokens will be transferred
    /// @param to The destination address of the transfer
    /// @param value The amount to be transferred
    function safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(bytes4(keccak256("transferFrom(address,address,uint256)")), from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'STF');
    }
}
