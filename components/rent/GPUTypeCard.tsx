'use client';

import type { GPUTypeInfo } from '@/hooks/useGPUTypes';

interface GPUTypeCardProps {
  gpu: GPUTypeInfo;
  onClick: () => void;
}

export function GPUTypeCard({ gpu, onClick }: GPUTypeCardProps) {
  const isAvailable = gpu.availableGpus > 0;

  return (
    <button
      onClick={onClick}
      disabled={!isAvailable}
      className={`
        w-full text-left p-5 rounded-xl border transition-all duration-200
        ${isAvailable
          ? 'bg-[#111] border-[#222] hover:border-purple-500/60 hover:bg-[#151515] cursor-pointer'
          : 'bg-[#0a0a0a] border-[#1a1a1a] opacity-60 cursor-not-allowed'
        }
      `}
    >
      {/* Header: GPU model */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white leading-tight">
          {gpu.gpuModel}
        </h3>
      </div>

      {/* Deploy button hint */}
      {isAvailable && (
        <div className="pt-3 border-t border-[#222]">
          <div className="text-center text-sm font-medium text-purple-400">
            Deploy
          </div>
        </div>
      )}
    </button>
  );
}

export default GPUTypeCard;
