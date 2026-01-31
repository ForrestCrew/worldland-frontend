---
phase: 08
plan: 03
subsystem: user-rental-flow
tags: [wagmi, react-query, blockchain, retry-logic]

dependency-graph:
  requires: [08-02]
  provides: [useStartRental, useStopRental, retryWithBackoff]
  affects: [08-04]

tech-stack:
  added: []
  patterns:
    - "2-phase transaction flow (blockchain + Hub API)"
    - "Retry with backoff for blockchain lag handling"
    - "Cache invalidation on transaction success"

key-files:
  created:
    - hooks/useStartRental.ts
    - hooks/useStopRental.ts
    - lib/rental-utils.ts
  modified:
    - hooks/index.ts

decisions:
  - id: v1.1
    title: "6 retries * 5s delay for Hub API during blockchain lag"
    rationale: "Covers 15-30s blockchain lag window"

metrics:
  duration: ~8 minutes
  completed: 2026-02-01
---

# Phase 08 Plan 03: Rental Start/Stop Hooks Summary

2-phase rental mutation hooks with blockchain lag handling via retry logic and immediate cache invalidation.

## One-liner

useStartRental/useStopRental hooks with 2-phase blockchain+Hub flow, 30s retry window, and React Query cache invalidation.

## What Was Built

### 1. Rental Utility Functions (`lib/rental-utils.ts`)

Core utilities for the 2-phase rental flow:

- **`RentalStage` type**: 5-state stage tracking (`idle`, `blockchain`, `hub`, `complete`, `error`)
- **`retryWithBackoff()`**: Generic retry function with configurable delay and retry count
- **`isRetryableHubError()`**: Determines if Hub API error is retryable (404, network, 5xx)
- **`SSHCredentials` interface**: SSH connection details from Hub API
- **Korean status messages**: Stage-specific UI feedback

Default retry configuration: 6 retries * 5s = 30s max wait (covers blockchain lag window).

### 2. useStartRental Hook (`hooks/useStartRental.ts`)

2-phase rental start with retry logic:

**Phase 1 - Blockchain:**
- Calls `startRental(provider, pricePerSecond)` on WorldlandRental contract
- Uses `writeContractAsync` from wagmi
- Tracks 6-state transaction status

**Phase 2 - Hub API:**
- Calls `POST /api/v1/rentals/:nodeId/start` with retry
- Handles blockchain lag via `retryWithBackoff`
- Returns SSH credentials on success

**Cache Invalidation:**
- `['rentals', 'user', address]` - User's rental sessions
- `['balance', address]` - Contract balance
- `['availableGPUs']` - GPU marketplace listing

**Exposed State:**
- `stage`: Current 2-phase stage
- `txStatus`: Blockchain transaction status (6-state)
- `sshCredentials`: SSH connection details from Hub
- `stageMessage`: Korean status message

### 3. useStopRental Hook (`hooks/useStopRental.ts`)

Single-phase rental stop:

- Calls `stopRental(rentalId)` on WorldlandRental contract
- Uses 6-state transaction lifecycle
- Immediate cache invalidation on submission

**Cache Invalidation:**
- `['rentals', 'user', address]` - User's rental sessions
- `['balance', address]` - Contract balance (settlement affects balance)
- `['rental', 'status']` - Current rental status

### 4. Barrel Export Update (`hooks/index.ts`)

Added exports for both new hooks under "User rental flow hooks" section.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| 6 retries * 5s delay | Covers 15-30s blockchain event processing lag |
| Separate stage vs txStatus tracking | Stage shows overall flow, txStatus shows blockchain-specific state |
| Immediate cache invalidation on stop | User expects immediate UI update on stop action |
| Include network/5xx in retryable errors | Hub may have transient issues, not just lag |

## Technical Notes

### Contract ABI Functions Used

```typescript
// startRental
functionName: 'startRental',
args: [provider, pricePerSecond]
// Returns: rentalId (uint256)

// stopRental
functionName: 'stopRental',
args: [rentalId]
// Returns: cost (uint256) - settlement amount
```

### Hub API Endpoints

```
POST /api/v1/rentals/:nodeId/start
- Body: { rentalId, transactionHash }
- Returns: { sshHost, sshPort, sshUser, sshPassword }
```

### Retry Logic Example

```typescript
const credentials = await retryWithBackoff(
  () => notifyHubStart({ rentalId, nodeId, txHash }),
  { maxRetries: 6, delayMs: 5000, shouldRetry: isRetryableHubError }
);
```

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

| File | Change |
|------|--------|
| `lib/rental-utils.ts` | Created - Retry utility and types |
| `hooks/useStartRental.ts` | Created - 2-phase start hook |
| `hooks/useStopRental.ts` | Created - Stop hook with cache invalidation |
| `hooks/index.ts` | Modified - Added exports |

## Next Phase Readiness

Ready for Phase 08-04. Provides:
- `useStartRental` hook for rental initiation UI
- `useStopRental` hook for rental termination UI
- `RentalStage` type for stage-based UI feedback
- Retry utilities for any future Hub API calls
