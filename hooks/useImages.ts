'use client';

import { useQuery } from '@tanstack/react-query';
import { getImages, BaseImage, ImageCategory } from '@/lib/api';

/**
 * Hook for fetching available base images
 *
 * Features:
 * - Fetches preset GPU images from Hub API
 * - 5-minute stale time (images don't change often)
 * - 2 retries on failure
 * - Graceful error handling
 *
 * @example
 * const { data: images, isLoading, error } = useImages();
 *
 * if (images) {
 *   const grouped = groupImagesByCategory(images);
 *   // grouped.pytorch, grouped.tensorflow, grouped.cuda
 * }
 */
export function useImages() {
  return useQuery<BaseImage[], Error>({
    queryKey: ['images'],
    queryFn: getImages,
    staleTime: 5 * 60 * 1000, // 5 minutes - images don't change often
    retry: 2,
  });
}

/**
 * Group images by category for organized UI display
 *
 * @param images - Array of base images
 * @returns Record mapping category to array of images
 *
 * @example
 * const grouped = groupImagesByCategory(images);
 * // { pytorch: [...], tensorflow: [...], cuda: [...] }
 */
export function groupImagesByCategory(
  images: BaseImage[]
): Record<ImageCategory, BaseImage[]> {
  const result: Record<ImageCategory, BaseImage[]> = {
    pytorch: [],
    tensorflow: [],
    cuda: [],
  };

  for (const img of images) {
    if (result[img.category]) {
      result[img.category].push(img);
    }
  }

  return result;
}

/**
 * Category display names for UI
 */
export const categoryDisplayNames: Record<ImageCategory, string> = {
  pytorch: 'PyTorch',
  tensorflow: 'TensorFlow',
  cuda: 'CUDA',
};
