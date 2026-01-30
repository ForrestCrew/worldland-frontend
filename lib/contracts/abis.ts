/**
 * WorldlandRental Contract ABI
 * Generated from WorldlandRental.sol
 *
 * Includes deposit/withdraw functions for balance management
 */
export const WorldlandRentalABI = [
  // Read functions
  {
    type: 'function',
    name: 'deposits',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paymentToken',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nextRentalId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'rentals',
    inputs: [{ name: 'rentalId', type: 'uint256' }],
    outputs: [
      { name: 'user', type: 'address' },
      { name: 'provider', type: 'address' },
      { name: 'startTime', type: 'uint256' },
      { name: 'pricePerSecond', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRental',
    inputs: [{ name: 'rentalId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'user', type: 'address' },
          { name: 'provider', type: 'address' },
          { name: 'startTime', type: 'uint256' },
          { name: 'pricePerSecond', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  // Write functions
  {
    type: 'function',
    name: 'deposit',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'startRental',
    inputs: [
      { name: 'provider', type: 'address' },
      { name: 'pricePerSecond', type: 'uint256' },
    ],
    outputs: [{ name: 'rentalId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'stopRental',
    inputs: [{ name: 'rentalId', type: 'uint256' }],
    outputs: [{ name: 'cost', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  // Events
  {
    type: 'event',
    name: 'Deposited',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Withdrawn',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RentalStarted',
    inputs: [
      { name: 'rentalId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'provider', type: 'address', indexed: true },
      { name: 'startTime', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RentalStopped',
    inputs: [
      { name: 'rentalId', type: 'uint256', indexed: true },
      { name: 'endTime', type: 'uint256', indexed: false },
      { name: 'cost', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * ERC20 Token ABI (minimal for approve/allowance)
 */
export const ERC20ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const;
