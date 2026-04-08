import { CONTRACTS } from './contracts'
import { bscTestnet } from './chains'

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

export const NATIVE_TOKEN: Token = {
  address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  symbol: 'tBNB',
  name: 'Testnet BNB',
  decimals: 18,
}

export const WBNB: Token = {
  address: CONTRACTS.WBNB,
  symbol: 'WBNB',
  name: 'Wrapped BNB',
  decimals: 18,
}

export const AXON: Token = {
  address: CONTRACTS.AxonToken,
  symbol: 'AXON',
  name: 'AxonSwap Token',
  decimals: 18,
}

export const mUSDC: Token = {
  address: CONTRACTS.mUSDC,
  symbol: 'mUSDC',
  name: 'Mock USDC',
  decimals: 6,
}

export const mUSDT: Token = {
  address: CONTRACTS.mUSDT,
  symbol: 'mUSDT',
  name: 'Mock USDT',
  decimals: 6,
}

export const mWBTC: Token = {
  address: CONTRACTS.mWBTC,
  symbol: 'mWBTC',
  name: 'Mock WBTC',
  decimals: 8,
}

export const mWETH: Token = {
  address: CONTRACTS.mWETH,
  symbol: 'mWETH',
  name: 'Mock WETH',
  decimals: 18,
}

export const DEFAULT_TOKENS: Token[] = [NATIVE_TOKEN, WBNB, AXON, mUSDC, mUSDT, mWBTC, mWETH]

export const CHAIN_CONFIG = bscTestnet
