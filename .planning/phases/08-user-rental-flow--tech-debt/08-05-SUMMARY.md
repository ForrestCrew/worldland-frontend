---
phase: 08
plan: 05
subsystem: user-rental-ui
tags: [tanstack-table, gpu-marketplace, rental-modal, search-filter]
depends_on:
  requires: [08-02, 08-03, 08-04]
  provides: [gpu-marketplace-ui, rental-start-modal]
  affects: [09-polish]
tech-stack:
  added: []
  patterns: [tanstack-table-sorting, bigint-sort-fn, modal-with-gas-estimate]
key-files:
  created:
    - components/rent/GPUFilterBar.tsx
    - components/rent/GPUList.tsx
    - components/rent/RentalStartModal.tsx
    - app/rent/page.tsx
  modified:
    - components/rent/index.ts
decisions:
  - id: bigint-price-sorting
    choice: "Custom sortingFn for BigInt price comparison in TanStack Table"
    reason: "TanStack Table doesn't natively handle BigInt sorting"
metrics:
  duration: 6m
  completed: 2026-01-31
---

# Phase 8 Plan 5: GPU Marketplace UI Summary

**One-liner:** GPU marketplace page with search/filter/sort table and rental start modal with gas preview and SSH key input.

## What Was Built

### GPUFilterBar Component
Search and filter controls for GPU marketplace:
- Search input for GPU model (gpuType)
- Max price filter (WLC/hour input, converts to wei)
- Min VRAM selector with preset options (8GB, 16GB, 24GB, 48GB)
- Region selector (asia, us, eu)
- Clear filters button
- All Korean UI labels

### GPUList Component
Sortable GPU table using TanStack Table:
- Columns: GPU Model, VRAM, Price/Hour, Region, Actions
- Custom `bigIntSortingFn` for price column BigInt comparison
- Price displayed per hour (converted from per-second storage)
- Sort indicators with visual feedback
- Loading skeleton state
- Empty state for no results
- Responsive design hiding actions on mobile

### RentalStartModal Component
Rental start flow with full transaction visibility:
- SSH public key input with validation (ssh-rsa, ssh-ed25519, etc.)
- Gas estimate display via `useGasEstimate` hook
- 2-phase rental flow integration with `useStartRental`
- Stage indicator showing blockchain -> hub -> complete
- Transaction status with 6-state feedback
- SSH credentials display on success with copy buttons
- Auto-close prevention to let user copy credentials

### /rent Page
Complete GPU marketplace page:
- Integrates GPUFilterBar, GPUList, RentalStartModal
- Auto-refresh every 30 seconds via `useAvailableGPUs`
- Error handling with retry option
- Info section explaining platform benefits
- Responsive layout

## Technical Decisions

### BigInt Price Sorting
TanStack Table doesn't natively handle BigInt comparison, so a custom `sortingFn` was implemented:

```typescript
const bigIntSortingFn: SortingFn<AvailableGPU> = (rowA, rowB) => {
  const priceA = BigInt(rowA.original.pricePerSecond);
  const priceB = BigInt(rowB.original.pricePerSecond);
  if (priceA < priceB) return -1;
  if (priceA > priceB) return 1;
  return 0;
};
```

### SSH Key Validation
Simple prefix-based validation for common SSH key formats:
- ssh-rsa
- ssh-ed25519
- ssh-dss
- ecdsa-sha2-* variants

## Key Patterns Used

1. **TanStack Table Pattern** - From NodeList.tsx (07-02)
2. **Modal Pattern** - From DepositModal.tsx (06-xx)
3. **Gas Estimate Display** - Using existing GasEstimateDisplay component
4. **Transaction Status** - Using existing TransactionStatus component
5. **2-Phase Rental Flow** - From useStartRental hook (08-03)

## Commits

| Hash | Message |
|------|---------|
| e4ebd30 | feat(08-05): add GPUFilterBar component |
| cef666a | feat(08-05): add GPUList component with TanStack Table |
| 3bf4213 | feat(08-05): add RentalStartModal and GPU marketplace page |

## Verification

- [x] GPUFilterBar has search, price, VRAM, region filters
- [x] GPUList uses TanStack Table with custom BigInt sorting
- [x] RentalStartModal has SSH key input with validation
- [x] RentalStartModal shows gas estimate
- [x] RentalStartModal integrates useStartRental hook
- [x] /rent page uses useAvailableGPUs hook
- [x] TypeScript type check passes
- [x] All files meet minimum line count requirements

## Deviations from Plan

None - plan executed exactly as written.

## Files

### Created
- `/home/ahwlsqja/worldland-backend/worldland-front/components/rent/GPUFilterBar.tsx` (281 lines)
- `/home/ahwlsqja/worldland-backend/worldland-front/components/rent/GPUList.tsx` (331 lines)
- `/home/ahwlsqja/worldland-backend/worldland-front/components/rent/RentalStartModal.tsx` (523 lines)
- `/home/ahwlsqja/worldland-backend/worldland-front/app/rent/page.tsx` (250 lines)

### Modified
- `/home/ahwlsqja/worldland-backend/worldland-front/components/rent/index.ts`

## Next Phase Readiness

Ready to proceed. The GPU marketplace UI is complete with:
- Search and filter functionality
- Sortable GPU list
- Full rental start flow with gas preview
- SSH credentials display

Integration with existing hooks (useAvailableGPUs, useStartRental) is working.
