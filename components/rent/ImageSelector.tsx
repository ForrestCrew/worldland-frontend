'use client';

import { useState, useEffect } from 'react';
import { useImages, groupImagesByCategory, categoryDisplayNames } from '@/hooks/useImages';
import type { BaseImage, ImageCategory } from '@/lib/api';

/**
 * Props for ImageSelector component
 */
interface ImageSelectorProps {
  /** Currently selected value (preset ID or custom URL) */
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
 * - Toggle for custom Docker image URL input
 * - Selection highlight for active preset
 * - Loading and error states
 * - TailwindCSS styling matching existing components
 *
 * Used in RentalStartModal to let users choose container image before starting rental.
 *
 * @example
 * <ImageSelector
 *   value={selectedImage}
 *   onChange={setSelectedImage}
 *   disabled={isCreating}
 * />
 */
export function ImageSelector({ value, onChange, disabled }: ImageSelectorProps) {
  const { data: images, isLoading, error } = useImages();
  const [isCustom, setIsCustom] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Sync custom URL state when value changes externally
  useEffect(() => {
    if (value && images) {
      // Check if value is a preset ID
      const isPreset = images.some((img) => img.id === value);
      if (!isPreset && value !== customUrl) {
        setIsCustom(true);
        setCustomUrl(value);
      }
    }
  }, [value, images, customUrl]);

  const groupedImages = images ? groupImagesByCategory(images) : null;

  /**
   * Handle preset image selection
   */
  const handlePresetSelect = (imageId: string) => {
    setIsCustom(false);
    setCustomUrl('');
    onChange(imageId);
  };

  /**
   * Handle custom image toggle
   */
  const handleCustomToggle = () => {
    setIsCustom(true);
    onChange(customUrl || null);
  };

  /**
   * Handle custom URL input change
   */
  const handleCustomChange = (url: string) => {
    setCustomUrl(url);
    onChange(url || null);
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

  // Error state - still allow custom URL
  if (error) {
    return (
      <div className="space-y-4">
        <label className="block text-sm text-gray-400">
          컨테이너 이미지
        </label>
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-400">
            프리셋 이미지를 불러올 수 없습니다. 커스텀 이미지 URL을 입력해 주세요.
          </p>
        </div>
        <div>
          <input
            type="text"
            placeholder="예: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime"
            value={customUrl}
            onChange={(e) => handleCustomChange(e.target.value)}
            disabled={disabled}
            className={`
              w-full bg-gray-800 border border-gray-700 rounded-lg
              p-3 text-white font-mono text-sm
              placeholder:text-gray-500
              focus:outline-none focus:border-purple-500
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
          <p className="mt-1 text-xs text-gray-500">
            공개 레지스트리의 유효한 Docker 이미지 참조를 입력하세요
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
          컨테이너 이미지
        </label>
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-400">
            등록된 프리셋 이미지가 없습니다. 커스텀 이미지 URL을 입력해 주세요.
          </p>
        </div>
        <CustomImageInput
          value={customUrl}
          onChange={handleCustomChange}
          disabled={disabled}
          isActive={true}
        />
      </div>
    );
  }

  // Category order for display
  const categoryOrder: ImageCategory[] = ['pytorch', 'tensorflow', 'cuda'];

  return (
    <div className="space-y-4">
      <label className="block text-sm text-gray-400">
        컨테이너 이미지
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
                  isSelected={value === img.id && !isCustom}
                  disabled={disabled}
                  onClick={() => handlePresetSelect(img.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Custom image option */}
      <div className="pt-3 border-t border-gray-800">
        <button
          type="button"
          disabled={disabled}
          onClick={handleCustomToggle}
          className={`
            w-full p-3 text-left border rounded-lg transition-colors
            ${isCustom
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-700 hover:border-gray-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="font-medium text-sm text-white">커스텀 이미지</div>
          <div className="text-xs text-gray-400 mt-1">
            직접 Docker 이미지 URL을 입력합니다
          </div>
        </button>

        {isCustom && (
          <CustomImageInput
            value={customUrl}
            onChange={handleCustomChange}
            disabled={disabled}
            isActive={true}
          />
        )}
      </div>
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

/**
 * Custom image URL input component
 */
interface CustomImageInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isActive: boolean;
}

function CustomImageInput({ value, onChange, disabled, isActive }: CustomImageInputProps) {
  if (!isActive) return null;

  return (
    <div className="mt-3">
      <input
        type="text"
        placeholder="예: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full bg-gray-800 border border-gray-700 rounded-lg
          p-3 text-white font-mono text-sm
          placeholder:text-gray-500
          focus:outline-none focus:border-purple-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      <p className="mt-1 text-xs text-gray-500">
        공개 레지스트리의 유효한 Docker 이미지 참조를 입력하세요
      </p>
    </div>
  );
}

export default ImageSelector;
