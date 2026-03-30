// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import './interfaces/IQuoter.sol';
import '../core/interfaces/IAxonSwapFactory.sol';
import '../core/interfaces/IAxonSwapPool.sol';
import '../libraries/TickMath.sol';

/// @title Quoter
/// @notice Provides quotes for swaps without executing them. Uses try/catch revert pattern.
contract Quoter is IQuoter {
    address public immutable factory;
    address public immutable WAXON;

    /// @dev Minimum sqrt ratio
    uint160 internal constant MIN_SQRT_RATIO = 4295128739;
    /// @dev Maximum sqrt ratio
    uint160 internal constant MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342;

    constructor(address _factory, address _WAXON) {
        factory = _factory;
        WAXON = _WAXON;
    }

    /// @dev Returns the pool for the given token pair and fee
    function getPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) private view returns (IAxonSwapPool) {
        return IAxonSwapPool(IAxonSwapFactory(factory).getPool(tokenA, tokenB, fee));
    }

    /// @inheritdoc IQuoter
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) public override returns (uint256 amountOut) {
        bool zeroForOne = tokenIn < tokenOut;

        try
            getPool(tokenIn, tokenOut, fee).swap(
                address(this), // address(0) might cause issues
                zeroForOne,
                int256(amountIn),
                sqrtPriceLimitX96 == 0
                    ? (zeroForOne ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1)
                    : sqrtPriceLimitX96,
                abi.encodePacked(tokenIn, fee, tokenOut)
            )
        {} catch (bytes memory reason) {
            return parseRevertReason(reason);
        }
    }

    /// @inheritdoc IQuoter
    function quoteExactInput(bytes memory path, uint256 amountIn) external override returns (uint256 amountOut) {
        while (true) {
            bool hasMultiplePools = path.length > 43;

            (address tokenIn, address tokenOut, uint24 fee) = decodeFirstPool(path);

            // the outputs of prior swaps become the inputs to subsequent ones
            amountIn = quoteExactInputSingle(tokenIn, tokenOut, fee, amountIn, 0);

            // decide whether to continue or terminate
            if (hasMultiplePools) {
                path = path[23:];
            } else {
                return amountIn;
            }
        }
    }

    /// @inheritdoc IQuoter
    function quoteExactOutputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountOut,
        uint160 sqrtPriceLimitX96
    ) public override returns (uint256 amountIn) {
        bool zeroForOne = tokenIn < tokenOut;

        try
            getPool(tokenIn, tokenOut, fee).swap(
                address(this),
                zeroForOne,
                -int256(amountOut),
                sqrtPriceLimitX96 == 0
                    ? (zeroForOne ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1)
                    : sqrtPriceLimitX96,
                abi.encodePacked(tokenOut, fee, tokenIn)
            )
        {} catch (bytes memory reason) {
            return parseRevertReason(reason);
        }
    }

    /// @inheritdoc IQuoter
    function quoteExactOutput(bytes memory path, uint256 amountOut) external override returns (uint256 amountIn) {
        while (true) {
            bool hasMultiplePools = path.length > 43;

            (address tokenOut, address tokenIn, uint24 fee) = decodeFirstPool(path);

            amountOut = quoteExactOutputSingle(tokenIn, tokenOut, fee, amountOut, 0);

            if (hasMultiplePools) {
                path = path[23:];
            } else {
                return amountOut;
            }
        }
    }

    /// @dev Callback from swap — always reverts to return the result
    function axonSwapSwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata
    ) external view {
        require(amount0Delta > 0 || amount1Delta > 0); // swaps entirely within 0-liquidity regions are not supported
        // encode the result and revert
        uint256 amountOut = amount0Delta > 0 ? uint256(-amount1Delta) : uint256(-amount0Delta);
        uint256 amountIn = amount0Delta > 0 ? uint256(amount0Delta) : uint256(amount1Delta);
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, amountOut)
            mstore(add(ptr, 0x20), amountIn)
            revert(ptr, 64)
        }
    }

    /// @dev Parses a revert reason that should contain the numeric quote
    function parseRevertReason(bytes memory reason) private pure returns (uint256) {
        if (reason.length != 64) {
            if (reason.length < 68) revert('Unexpected error');
            assembly {
                reason := add(reason, 0x04)
            }
            revert(abi.decode(reason, (string)));
        }
        return abi.decode(reason, (uint256));
    }

    /// @dev Decode the first pool in path
    function decodeFirstPool(bytes memory path)
        internal
        pure
        returns (
            address tokenA,
            address tokenB,
            uint24 fee
        )
    {
        require(path.length >= 43, 'Invalid path');
        assembly {
            tokenA := div(mload(add(path, 0x20)), 0x1000000000000000000000000)
            fee := mload(add(path, 0x37))
            tokenB := div(mload(add(path, 0x3a)), 0x1000000000000000000000000)
        }
        fee = uint24(fee);
    }
}
