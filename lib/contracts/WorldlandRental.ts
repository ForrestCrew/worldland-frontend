/**
 * WorldlandRental Contract Configuration
 *
 * Re-exports ABI and addresses for convenient imports.
 * Use with wagmi hooks for type-safe contract interactions.
 *
 * @example
 * import { WorldlandRentalABI, RENTAL_CONTRACT_ADDRESS } from '@/lib/contracts/WorldlandRental';
 *
 * const { writeContract } = useWriteContract();
 * await writeContract({
 *   address: RENTAL_CONTRACT_ADDRESS,
 *   abi: WorldlandRentalABI,
 *   functionName: 'deposit',
 *   args: [amount],
 * });
 */

export { WorldlandRentalABI, ERC20ABI } from './abis';
export {
  RENTAL_CONTRACT_ADDRESS,
  PAYMENT_TOKEN_ADDRESS,
  validateContractAddresses,
} from './addresses';
