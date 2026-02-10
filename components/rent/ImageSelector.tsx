'use client';

import { useImages, groupImagesByCategory, categoryDisplayNames } from '@/hooks/useImages';
import type { BaseImage, ImageCategory } from '@/lib/api';

/**
 * Props for ImageSelector component
 */
interface ImageSelectorProps {
  /** Currently selected value (preset ID) */
  value: string | null;
  /** Callback when selection changes */
  onChange: (value: string | null) => void;
  /** Disable interaction (e.g., during transaction) */
  disabled?: boolean;
}

/**
 * ImageSelector - Component for selecting GPU container images
 *
 * Features:
 * - Displays preset images grouped by category (PyTorch, TensorFlow, CUDA)
 * - Only preset images allowed (no custom URLs for security)
 * - Selection highlight for active preset
 * - Loading and error states
 *
 * Used in RentalStartModal to let users choose container image before starting rental.
 */
export function ImageSelector({ value, onChange, disabled }: ImageSelectorProps) {
  const { data: images, isLoading, error } = useImages();

  const groupedImages = images ? groupImagesByCategory(images) : null;

  /**
   * Handle preset image selection
   */
  const handlePresetSelect = (imageId: string) => {
    onChange(imageId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-24 bg-gray-700 rounded"></div>
        <div className="h-16 bg-gray-800 rounded-lg"></div>
        <div className="h-16 bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <label className="block text-sm text-gray-400">
          Container Image
        </label>
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-400">
            Failed to load preset images. Default image will be used.
          </p>
        </div>
      </div>
    );
  }

  // No images available
  if (!groupedImages || Object.values(groupedImages).every((arr) => arr.length === 0)) {
    return (
      <div className="space-y-4">
        <label className="block text-sm text-gray-400">
          Container Image
        </label>
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-400">
            No preset images available. Default image will be used.
          </p>
        </div>
      </div>
    );
  }

  // Category order for display
  const categoryOrder: ImageCategory[] = ['pytorch', 'tensorflow', 'cuda'];

  return (
    <div className="space-y-4">
      <label className="block text-sm text-gray-400">
        Container Image
      </label>

      {/* Preset images grouped by category */}
      {categoryOrder.map((category) => {
        const categoryImages = groupedImages[category];
        if (!categoryImages || categoryImages.length === 0) return null;

        return (
          <div key={category} className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {categoryDisplayNames[category]}
            </span>
            <div className="space-y-2">
              {categoryImages.map((img) => (
                <ImagePresetButton
                  key={img.id}
                  image={img}
                  isSelected={value === img.id}
                  disabled={disabled}
                  onClick={() => handlePresetSelect(img.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Preset image button component
 */
interface ImagePresetButtonProps {
  image: BaseImage;
  isSelected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ImagePresetButton({ image, isSelected, disabled, onClick }: ImagePresetButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        w-full p-3 text-left border rounded-lg transition-colors
        ${isSelected
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-gray-700 hover:border-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm text-white">{image.name}</div>
        {image.gpuRequired && (
          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
            GPU
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1 font-mono truncate">
        {image.dockerImage}
      </div>
      {image.description && (
        <div className="text-xs text-gray-400 mt-1">
          {image.description}
        </div>
      )}
    </button>
  );
}

export default ImageSelector;
