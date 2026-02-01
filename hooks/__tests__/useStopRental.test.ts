import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, createElement } from 'react';

// Mock wagmi hooks
const mockWriteContractAsync = vi.fn();
const mockReset = vi.fn();
let mockIsPending = false;
let mockHash: `0x${string}` | undefined = undefined;
let mockWriteError: Error | null = null;
let mockIsConfirming = false;
let mockIsConfirmed = false;
let mockConfirmError: Error | null = null;

vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useAccount: () => ({ address: '0x1234567890123456789012345678901234567890' }),
    useWriteContract: () => ({
      data: mockHash,
      isPending: mockIsPending,
      error: mockWriteError,
      writeContractAsync: mockWriteContractAsync,
      reset: mockReset,
    }),
    useWaitForTransactionReceipt: () => ({
      isLoading: mockIsConfirming,
      isSuccess: mockIsConfirmed,
      error: mockConfirmError,
    }),
  };
});

// Mock the error messages module
vi.mock('@/lib/error-messages', () => ({
  getErrorMessage: (error: Error) => {
    if (error.message.includes('rejected')) {
      return '사용자가 트랜잭션을 취소했습니다';
    }
    return '트랜잭션 처리 중 오류가 발생했습니다';
  },
}));

// Mock the contracts module
vi.mock('@/lib/contracts/WorldlandRental', () => ({
  WorldlandRentalABI: [],
  RENTAL_CONTRACT_ADDRESS: '0x0000000000000000000000000000000000000001',
}));

// Import after mocks
import { useStopRental } from '../useStopRental';

describe('useStopRental', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset all mock state
    mockIsPending = false;
    mockHash = undefined;
    mockWriteError = null;
    mockIsConfirming = false;
    mockIsConfirmed = false;
    mockConfirmError = null;

    vi.clearAllMocks();
  });

  it('should start with idle status', () => {
    const { result } = renderHook(() => useStopRental(), { wrapper });

    expect(result.current.status).toBe('idle');
    expect(result.current.hash).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should call writeContractAsync with correct args', async () => {
    mockWriteContractAsync.mockResolvedValue('0xhash123');

    const { result } = renderHook(() => useStopRental(), { wrapper });

    await act(async () => {
      await result.current.stopRental({ rentalId: BigInt(123) });
    });

    expect(mockWriteContractAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'stopRental',
        args: [BigInt(123)],
      })
    );
  });

  it('should handle transaction rejection error', async () => {
    const mockError = new Error('User rejected the request');
    mockWriteContractAsync.mockRejectedValue(mockError);

    const { result } = renderHook(() => useStopRental(), { wrapper });

    await act(async () => {
      try {
        await result.current.stopRental({ rentalId: BigInt(123) });
      } catch {
        // Expected to throw
      }
    });

    // Verify writeContractAsync was called despite rejection
    expect(mockWriteContractAsync).toHaveBeenCalledTimes(1);
  });

  it('should reset state when reset is called', () => {
    const { result } = renderHook(() => useStopRental(), { wrapper });

    act(() => {
      result.current.reset();
    });

    expect(mockReset).toHaveBeenCalled();
  });

  it('should handle BigInt rentalId correctly', async () => {
    mockWriteContractAsync.mockResolvedValue('0xhash456');

    const { result } = renderHook(() => useStopRental(), { wrapper });
    const largeRentalId = BigInt('123456789012345678901234567890');

    await act(async () => {
      await result.current.stopRental({ rentalId: largeRentalId });
    });

    expect(mockWriteContractAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        args: [largeRentalId],
      })
    );
  });

  it('should return correct status types', () => {
    const { result } = renderHook(() => useStopRental(), { wrapper });

    // Verify return type structure
    expect(result.current).toHaveProperty('stopRental');
    expect(result.current).toHaveProperty('status');
    expect(result.current).toHaveProperty('hash');
    expect(result.current).toHaveProperty('settlementAmount');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('errorMessage');
    expect(result.current).toHaveProperty('reset');

    // Verify functions are callable
    expect(typeof result.current.stopRental).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });
});
