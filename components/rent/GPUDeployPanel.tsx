'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAvailableGPUs, type AvailableGPU } from '@/hooks/useAvailableGPUs';
import type { GPUTypeInfo } from '@/hooks/useGPUTypes';
import { RentalStartModal } from './RentalStartModal';

interface GPUDeployPanelProps {
  gpu: GPUTypeInfo;
  onBack: () => void;
}

export function GPUDeployPanel({ gpu, onBack }: GPUDeployPanelProps) {
  const { gpus: nodes, isLoading } = useAvailableGPUs({ gpuModel: gpu.gpuModel });
  const [selectedNode, setSelectedNode] = useState<AvailableGPU | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      const sorted = [...nodes].sort((a, b) => {
        const pa = parseFloat(a.pricePerHour || '0');
        const pb = parseFloat(b.pricePerHour || '0');
        return pa - pb;
      });
      setSelectedNode(sorted[0]);
    }
  }, [nodes, selectedNode]);

  const handleDeploy = useCallback(() => {
    if (selectedNode) {
      setIsModalOpen(true);
    }
  }, [selectedNode]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Marketplace
      </button>

      {/* GPU header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Deploy {gpu.gpuModel}
        </h2>
        <p className="text-gray-400">
          {Number(gpu.pricePerHour || '0').toFixed(2)} WLC/hr
        </p>
      </div>

      {/* Node selection */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Select Node</h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : nodes.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">
            No nodes available at the moment
          </p>
        ) : (
          <div className="space-y-2">
            {nodes.map((node) => (
              <button
                key={node.nodeId}
                onClick={() => setSelectedNode(node)}
                className={`
                  w-full flex items-center justify-between p-4 rounded-lg border transition-colors text-left
                  ${selectedNode?.nodeId === node.nodeId
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }
                `}
              >
                <div>
                  <div className="text-sm text-white font-medium">
                    {node.gpuModel || node.gpuType}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    {node.nodeId.slice(0, 8)}...{node.nodeId.slice(-8)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-purple-400">
                    {Number(node.pricePerHour || '0').toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">WLC/hr</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Deploy button */}
      <button
        onClick={handleDeploy}
        disabled={!selectedNode}
        className={`
          w-full py-4 rounded-xl text-white font-medium text-lg transition-colors
          ${selectedNode
            ? 'bg-purple-600 hover:bg-purple-700'
            : 'bg-gray-700 cursor-not-allowed'
          }
        `}
      >
        Deploy
      </button>

      {/* Rental modal */}
      <RentalStartModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        gpu={selectedNode}
      />
    </div>
  );
}

export default GPUDeployPanel;
