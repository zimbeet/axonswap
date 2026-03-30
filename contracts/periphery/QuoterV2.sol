// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import './interfaces/IQuoterV2.sol';
import '../core/interfaces/IAxonSwapFactory.sol';
import '../core/interfaces/IAxonSwapPool.sol';
import '../libraries/TickMath.sol';

/// @title QuoterV2
/// @notice Provides quotes for swaps with additional data (gas, sqrt price, ticks crossed)
contract QuoterV2 is IQuoterV2 {
    address public immutable factory;
    address public immutable WAXON;

    uint160 internal constant MIN_SQRT_RATIO = 4295128739;
    uint160 internal constant MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342;

    constructor(address _factory, address _WAXON) {
        factory = _factory;
        WAXON = _WAXON;
    }

    function getPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) private view returns (IAxonSwapPool) {
        return IAxonSwapPool(IAxonSwapFactory(factory).getPool(tokenA, tokenB, fee));
    }

    /// @inheritdoc IQuoterV2
    function quoteExactInputSingle(QuoteExactInputSingleParams memory params)
        public
        override
        returns (
            uint256 amountOut,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        )
    {
        bool zeroForOne = params.tokenIn < params.tokenOut;
        IAxonSwapPool pool = getPool(params.tokenIn, params.tokenOut, params.fee);

        uint256 gasBefore = gasleft();
        try
            pool.swap(
                address(this),
                zeroForOne,
                int256(params.amountIn),
                params.sqrtPriceLimitX96 == 0
                    ? (zeroForOne ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1)
                    : params.sqrtPriceLimitX96,
                abi.encodePacked(params.tokenIn, params.fee, params.tokenOut)
            )
        {} catch (bytes memory reason) {
            gasEstimate = gasBefore - gasleft();
            return handleRevert(reason, pool, gasEstimate);
        }
    }

    /// @inheritdoc IQuoterV2
    function quoteExactInput(bytes memory path, uint256 amountIn)
        external
        override
        returns (
            uint256 amountOut,
            uint160[] memory sqrtPriceX96AfterList,
            uint32[] memory initializedTicksCrossedList,
            uint256 gasEstimate
        )
    {
        // Count pools in path
        uint256 numPools = (path.length - 20) / 23;
        sqrtPriceX96AfterList = new uint160[](numPools);
        initializedTicksCrossedList = new uint32[](numPools);

        uint256 i = 0;
        while (true) {
            (address tokenIn, address tokenOut, uint24 fee) = decodeFirstPool(path);

            // the outputs of prior swaps become the inputs to subsequent ones
            (uint256 _amountOut, uint160 _sqrtPriceX96After, uint32 _initializedTicksCrossed, uint256 _gasEstimate) =
                quoteExactInputSingle(
                    QuoteExactInputSingleParams({
                        tokenIn: tokenIn,
                        tokenOut: tokenOut,
                        fee: fee,
                        amountIn: amountIn,
                        sqrtPriceLimitX96: 0
                    })
                );

            sqrtPriceX96AfterList[i] = _sqrtPriceX96After;
            initializedTicksCrossedList[i] = _initializedTicksCrossed;
            amountIn = _amountOut;
            gasEstimate += _gasEstimate;
            i++;

            // decide whether to continue or terminate
            if (path.length > 43) {
                path = path[23:];
            } else {
                return (amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList, gasEstimate);
            }
        }
    }

    /// @inheritdoc IQuoterV2
    function quoteExactOutputSingle(QuoteExactOutputSingleParams memory params)
        public
        override
        returns (
            uint256 amountIn,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        )
    {
        bool zeroForOne = params.tokenIn < params.tokenOut;
        IAxonSwapPool pool = getPool(params.tokenIn, params.tokenOut, params.fee);

        uint256 gasBefore = gasleft();
        try
            pool.swap(
                address(this),
                zeroForOne,
                -int256(params.amount),
                params.sqrtPriceLimitX96 == 0
                    ? (zeroForOne ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1)
                    : params.sqrtPriceLimitX96,
                abi.encodePacked(params.tokenOut, params.fee, params.tokenIn)
            )
        {} catch (bytes memory reason) {
            gasEstimate = gasBefore - gasleft();
            return handleRevert(reason, pool, gasEstimate);
        }
    }

    /// @inheritdoc IQuoterV2
    function quoteExactOutput(bytes memory path, uint256 amountOut)
        external
        override
        returns (
            uint256 amountIn,
            uint160[] memory sqrtPriceX96AfterList,
            uint32[] memory initializedTicksCrossedList,
            uint256 gasEstimate
        )
    {
        uint256 numPools = (path.length - 20) / 23;
        sqrtPriceX96AfterList = new uint160[](numPools);
        initializedTicksCrossedList = new uint32[](numPools);

        uint256 i = 0;
        while (true) {
            (address tokenOut, address tokenIn, uint24 fee) = decodeFirstPool(path);

            (uint256 _amountIn, uint160 _sqrtPriceX96After, uint32 _initializedTicksCrossed, uint256 _gasEstimate) =
                quoteExactOutputSingle(
                    QuoteExactOutputSingleParams({
                        tokenIn: tokenIn,
                        tokenOut: tokenOut,
                        amount: amountOut,
                        fee: fee,
                        sqrtPriceLimitX96: 0
                    })
                );

            sqrtPriceX96AfterList[i] = _sqrtPriceX96After;
            initializedTicksCrossedList[i] = _initializedTicksCrossed;
            amountOut = _amountIn;
            gasEstimate += _gasEstimate;
            i++;

            if (path.length > 43) {
                path = path[23:];
            } else {
                return (amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList, gasEstimate);
            }
        }
    }

    /// @dev Callback from swap — always reverts to return the result
    function axonSwapSwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata
    ) external view {
        require(amount0Delta > 0 || amount1Delta > 0);
        uint256 amountOut = amount0Delta > 0 ? uint256(-amount1Delta) : uint256(-amount0Delta);
        uint256 amountIn = amount0Delta > 0 ? uint256(amount0Delta) : uint256(amount1Delta);
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, amountOut)
            mstore(add(ptr, 0x20), amountIn)
            revert(ptr, 64)
        }
    }

    function handleRevert(bytes memory reason, IAxonSwapPool pool, uint256 gasEstimate)
        private
        view
        returns (
            uint256 amount,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256
        )
    {
        if (reason.length != 64) {
            if (reason.length < 68) revert('Unexpected error');
            assembly {
                reason := add(reason, 0x04)
            }
            revert(abi.decode(reason, (string)));
        }
        amount = abi.decode(reason, (uint256));

        (sqrtPriceX96After, , , , , , ) = pool.slot0();

        // We approximate initializedTicksCrossed as 0 for simplicity in the quoter
        initializedTicksCrossed = 0;

        return (amount, sqrtPriceX96After, initializedTicksCrossed, gasEstimate);
    }

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
