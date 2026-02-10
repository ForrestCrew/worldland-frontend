'use client';

import type { AvailableGPU } from '@/hooks/useAvailableGPUs';

export interface ResourceSelection {
  gpuCount: number;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
}

interface ResourceSelectorProps {
  gpu: AvailableGPU;
  value: ResourceSelection;
  onChange: (resources: ResourceSelection) => void;
}

const CPU_OPTIONS = [1, 2, 4, 8, 16, 32, 64];
const MEMORY_OPTIONS = [4, 8, 16, 32, 64, 128, 256];
const STORAGE_OPTIONS = [10, 20, 30, 40, 50, 60, 80, 100];

export function ResourceSelector({ gpu, value, onChange }: ResourceSelectorProps) {
  const gpuOptions = Array.from(
    { length: gpu.availableGpus || 1 },
    (_, i) => i + 1
  );
  const cpuOptions = CPU_OPTIONS.filter(
    (c) => gpu.totalCpuCores <= 0 || c <= gpu.totalCpuCores
  );
  const memoryOptions = MEMORY_OPTIONS.filter(
    (m) => gpu.totalMemoryGb <= 0 || m <= gpu.totalMemoryGb
  );
  // Dynamic storage options based on node's actual ephemeral-storage capacity
  const maxStorage = gpu.maxStorageGb || 40; // fallback 40GB if not reported
  const storageOptions = STORAGE_OPTIONS.filter((s) => s <= maxStorage);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-300">Resource Configuration</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* GPU Count */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400">GPU Count</label>
          <div className="flex items-center gap-2">
            <select
              value={value.gpuCount}
              onChange={(e) =>
                onChange({ ...value, gpuCount: Number(e.target.value) })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              {gpuOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              / {gpu.availableGpus}
            </span>
          </div>
        </div>

        {/* CPU Cores */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400">CPU Cores</label>
          <div className="flex items-center gap-2">
            <select
              value={value.cpuCores}
              onChange={(e) =>
                onChange({ ...value, cpuCores: Number(e.target.value) })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              {cpuOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {gpu.totalCpuCores > 0 && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                / {gpu.totalCpuCores}
              </span>
            )}
          </div>
        </div>

        {/* Memory */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Memory (GB)</label>
          <div className="flex items-center gap-2">
            <select
              value={value.memoryGB}
              onChange={(e) =>
                onChange({ ...value, memoryGB: Number(e.target.value) })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              {memoryOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {gpu.totalMemoryGb > 0 && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                / {gpu.totalMemoryGb}
              </span>
            )}
          </div>
        </div>

        {/* Storage */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400">
            Storage (GB)
          </label>
          <div className="flex items-center gap-2">
            <select
              value={value.storageGB}
              onChange={(e) =>
                onChange({ ...value, storageGB: Number(e.target.value) })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              {storageOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {maxStorage > 0 && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                / {maxStorage}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResourceSelector;
