// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

import './IAxonSwapPoolImmutables.sol';
import './IAxonSwapPoolState.sol';
import './IAxonSwapPoolDerivedState.sol';
import './IAxonSwapPoolActions.sol';
import './IAxonSwapPoolOwnerActions.sol';
import './IAxonSwapPoolEvents.sol';

/// @title The interface for an AxonSwap Pool
/// @notice A pool facilitates swapping and automated market making between any two assets that strictly conform
/// to the ERC20 specification
/// @dev The pool interface is broken up into many smaller pieces
interface IAxonSwapPool is
    IAxonSwapPoolImmutables,
    IAxonSwapPoolState,
    IAxonSwapPoolDerivedState,
    IAxonSwapPoolActions,
    IAxonSwapPoolOwnerActions,
    IAxonSwapPoolEvents
{

}
