// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import './interfaces/INonfungiblePositionManager.sol';
import '../core/interfaces/IAxonSwapFactory.sol';
import '../core/interfaces/IAxonSwapPool.sol';
import '../libraries/TickMath.sol';
import '../libraries/LiquidityAmounts.sol';
import '../libraries/FixedPoint128.sol';
import '../libraries/FullMath.sol';

/// @title NFT positions
/// @notice Wraps AxonSwap positions in the ERC721 non-fungible token interface
contract NonfungiblePositionManager is INonfungiblePositionManager {
    /// @dev The factory contract
    address public immutable factory;
    /// @dev The WAXON contract
    address public immutable WAXON;

    /// @dev The ID of the next token that will be minted. Skips 0
    uint176 private _nextId = 1;

    /// @dev The token ID position data
    mapping(uint256 => Position) private _positions;

    /// @dev Owner mapping (simple ERC-721 implementation)
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    struct Position {
        // the nonce for permits
        uint96 nonce;
        // the address that is approved for spending this token
        address operator;
        // the ID of the pool with which this token is connected
        address token0;
        address token1;
        uint24 fee;
        // the tick range of the position
        int24 tickLower;
        int24 tickUpper;
        // the liquidity of the position
        uint128 liquidity;
        // the fee growth of the aggregate position as of the last action on the individual position
        uint256 feeGrowthInside0LastX128;
        uint256 feeGrowthInside1LastX128;
        // how many uncollected tokens are owed to the position, as of the last computation
        uint128 tokensOwed0;
        uint128 tokensOwed1;
    }

    modifier checkDeadline(uint256 deadline) {
        require(block.timestamp <= deadline, 'Transaction too old');
        _;
    }

    modifier isAuthorizedForToken(uint256 tokenId) {
        require(_isApprovedOrOwner(msg.sender, tokenId), 'Not approved');
        _;
    }

    constructor(address _factory, address _WAXON) {
        factory = _factory;
        WAXON = _WAXON;
    }

    /// @inheritdoc INonfungiblePositionManager
    function positions(uint256 tokenId)
        external
        view
        override
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        )
    {
        Position memory position = _positions[tokenId];
        require(position.token0 != address(0), 'Invalid token ID');
        return (
            position.nonce,
            position.operator,
            position.token0,
            position.token1,
            position.fee,
            position.tickLower,
            position.tickUpper,
            position.liquidity,
            position.feeGrowthInside0LastX128,
            position.feeGrowthInside1LastX128,
            position.tokensOwed0,
            position.tokensOwed1
        );
    }

    /// @inheritdoc INonfungiblePositionManager
    function mint(MintParams calldata params)
        external
        payable
        override
        checkDeadline(params.deadline)
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        IAxonSwapPool pool = IAxonSwapPool(IAxonSwapFactory(factory).getPool(params.token0, params.token1, params.fee));
        require(address(pool) != address(0), 'Pool does not exist');

        // Compute liquidity from amounts
        (uint160 sqrtPriceX96, , , , , , ) = pool.slot0();
        uint160 sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(params.tickLower);
        uint160 sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(params.tickUpper);

        liquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            sqrtRatioAX96,
            sqrtRatioBX96,
            params.amount0Desired,
            params.amount1Desired
        );

        (amount0, amount1) = pool.mint(
            address(this),
            params.tickLower,
            params.tickUpper,
            liquidity,
            abi.encode(msg.sender)
        );

        require(amount0 >= params.amount0Min && amount1 >= params.amount1Min, 'Price slippage check');

        // mint the NFT
        tokenId = _nextId++;
        _mint(params.recipient, tokenId);

        (, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, , ) =
            pool.positions(keccak256(abi.encodePacked(address(this), params.tickLower, params.tickUpper)));

        _positions[tokenId] = Position({
            nonce: 0,
            operator: address(0),
            token0: params.token0,
            token1: params.token1,
            fee: params.fee,
            tickLower: params.tickLower,
            tickUpper: params.tickUpper,
            liquidity: liquidity,
            feeGrowthInside0LastX128: feeGrowthInside0LastX128,
            feeGrowthInside1LastX128: feeGrowthInside1LastX128,
            tokensOwed0: 0,
            tokensOwed1: 0
        });

        emit IncreaseLiquidity(tokenId, liquidity, amount0, amount1);
    }

    /// @inheritdoc INonfungiblePositionManager
    function increaseLiquidity(IncreaseLiquidityParams calldata params)
        external
        payable
        override
        checkDeadline(params.deadline)
        isAuthorizedForToken(params.tokenId)
        returns (
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        Position storage position = _positions[params.tokenId];

        IAxonSwapPool pool = IAxonSwapPool(IAxonSwapFactory(factory).getPool(position.token0, position.token1, position.fee));

        (uint160 sqrtPriceX96, , , , , , ) = pool.slot0();
        uint160 sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(position.tickLower);
        uint160 sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(position.tickUpper);

        liquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            sqrtRatioAX96,
            sqrtRatioBX96,
            params.amount0Desired,
            params.amount1Desired
        );

        (amount0, amount1) = pool.mint(
            address(this),
            position.tickLower,
            position.tickUpper,
            liquidity,
            abi.encode(msg.sender)
        );

        require(amount0 >= params.amount0Min && amount1 >= params.amount1Min, 'Price slippage check');

        // update position
        (, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, , ) =
            pool.positions(keccak256(abi.encodePacked(address(this), position.tickLower, position.tickUpper)));

        position.tokensOwed0 += uint128(
            FullMath.mulDiv(
                feeGrowthInside0LastX128 - position.feeGrowthInside0LastX128,
                position.liquidity,
                FixedPoint128.Q128
            )
        );
        position.tokensOwed1 += uint128(
            FullMath.mulDiv(
                feeGrowthInside1LastX128 - position.feeGrowthInside1LastX128,
                position.liquidity,
                FixedPoint128.Q128
            )
        );

        position.feeGrowthInside0LastX128 = feeGrowthInside0LastX128;
        position.feeGrowthInside1LastX128 = feeGrowthInside1LastX128;
        position.liquidity += liquidity;

        emit IncreaseLiquidity(params.tokenId, liquidity, amount0, amount1);
    }

    /// @inheritdoc INonfungiblePositionManager
    function decreaseLiquidity(DecreaseLiquidityParams calldata params)
        external
        payable
        override
        checkDeadline(params.deadline)
        isAuthorizedForToken(params.tokenId)
        returns (uint256 amount0, uint256 amount1)
    {
        require(params.liquidity > 0);
        Position storage position = _positions[params.tokenId];

        uint128 positionLiquidity = position.liquidity;
        require(positionLiquidity >= params.liquidity);

        IAxonSwapPool pool = IAxonSwapPool(IAxonSwapFactory(factory).getPool(position.token0, position.token1, position.fee));

        (amount0, amount1) = pool.burn(position.tickLower, position.tickUpper, params.liquidity);

        require(amount0 >= params.amount0Min && amount1 >= params.amount1Min, 'Price slippage check');

        (, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, , ) =
            pool.positions(keccak256(abi.encodePacked(address(this), position.tickLower, position.tickUpper)));

        position.tokensOwed0 +=
            uint128(amount0) +
            uint128(
                FullMath.mulDiv(
                    feeGrowthInside0LastX128 - position.feeGrowthInside0LastX128,
                    positionLiquidity,
                    FixedPoint128.Q128
                )
            );
        position.tokensOwed1 +=
            uint128(amount1) +
            uint128(
                FullMath.mulDiv(
                    feeGrowthInside1LastX128 - position.feeGrowthInside1LastX128,
                    positionLiquidity,
                    FixedPoint128.Q128
                )
            );

        position.feeGrowthInside0LastX128 = feeGrowthInside0LastX128;
        position.feeGrowthInside1LastX128 = feeGrowthInside1LastX128;
        position.liquidity = positionLiquidity - params.liquidity;

        emit DecreaseLiquidity(params.tokenId, params.liquidity, amount0, amount1);
    }

    /// @inheritdoc INonfungiblePositionManager
    function collect(CollectParams calldata params)
        external
        payable
        override
        isAuthorizedForToken(params.tokenId)
        returns (uint256 amount0, uint256 amount1)
    {
        Position storage position = _positions[params.tokenId];

        IAxonSwapPool pool = IAxonSwapPool(IAxonSwapFactory(factory).getPool(position.token0, position.token1, position.fee));

        // trigger an update of the position fees owed, with a 0 burn
        pool.burn(position.tickLower, position.tickUpper, 0);

        (, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, , ) =
            pool.positions(keccak256(abi.encodePacked(address(this), position.tickLower, position.tickUpper)));

        position.tokensOwed0 += uint128(
            FullMath.mulDiv(
                feeGrowthInside0LastX128 - position.feeGrowthInside0LastX128,
                position.liquidity,
                FixedPoint128.Q128
            )
        );
        position.tokensOwed1 += uint128(
            FullMath.mulDiv(
                feeGrowthInside1LastX128 - position.feeGrowthInside1LastX128,
                position.liquidity,
                FixedPoint128.Q128
            )
        );

        position.feeGrowthInside0LastX128 = feeGrowthInside0LastX128;
        position.feeGrowthInside1LastX128 = feeGrowthInside1LastX128;

        uint128 tokensOwed0 = position.tokensOwed0;
        uint128 tokensOwed1 = position.tokensOwed1;

        // compute the actual amounts to collect
        uint128 amount0Collect = params.amount0Max > tokensOwed0 ? tokensOwed0 : params.amount0Max;
        uint128 amount1Collect = params.amount1Max > tokensOwed1 ? tokensOwed1 : params.amount1Max;

        // collect from the pool
        (amount0, amount1) = pool.collect(params.recipient, position.tickLower, position.tickUpper, amount0Collect, amount1Collect);

        // update position
        position.tokensOwed0 -= uint128(amount0);
        position.tokensOwed1 -= uint128(amount1);

        emit Collect(params.tokenId, params.recipient, amount0, amount1);
    }

    /// @inheritdoc INonfungiblePositionManager
    function burn(uint256 tokenId) external payable override isAuthorizedForToken(tokenId) {
        Position storage position = _positions[tokenId];
        require(position.liquidity == 0 && position.tokensOwed0 == 0 && position.tokensOwed1 == 0, 'Not cleared');
        delete _positions[tokenId];
        _burn(tokenId);
    }

    /// @dev Callback for minting liquidity to the pool
    function axonSwapMintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata data
    ) external {
        address payer = abi.decode(data, (address));
        if (amount0Owed > 0) {
            IERC20Minimal(IAxonSwapPool(msg.sender).token0()).transferFrom(payer, msg.sender, amount0Owed);
        }
        if (amount1Owed > 0) {
            IERC20Minimal(IAxonSwapPool(msg.sender).token1()).transferFrom(payer, msg.sender, amount1Owed);
        }
    }

    // ============ Simple ERC-721 Implementation ============

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), 'ERC721: mint to zero address');
        require(_owners[tokenId] == address(0), 'ERC721: already minted');
        _balances[to] += 1;
        _owners[tokenId] = to;
    }

    function _burn(uint256 tokenId) internal {
        address owner = _owners[tokenId];
        _balances[owner] -= 1;
        delete _owners[tokenId];
        delete _tokenApprovals[tokenId];
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = _owners[tokenId];
        return (spender == owner || _tokenApprovals[tokenId] == spender || _operatorApprovals[owner][spender]);
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), 'ERC721: invalid token ID');
        return owner;
    }

    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), 'ERC721: zero address');
        return _balances[owner];
    }

    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(to != owner, 'ERC721: self-approve');
        require(msg.sender == owner || _operatorApprovals[owner][msg.sender], 'ERC721: not authorized');
        _tokenApprovals[tokenId] = to;
    }

    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, 'ERC721: self-approve');
        _operatorApprovals[msg.sender][operator] = approved;
    }

    receive() external payable {}
}

interface IERC20Minimal {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}
