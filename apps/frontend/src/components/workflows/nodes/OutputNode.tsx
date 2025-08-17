import React from "react";
import { Handle, Position } from "@xyflow/react";

interface OutputNodeData {
  label: string;
  outputType?: string;
  config?: Record<string, unknown>;
}

interface OutputNodeProps {
  data: OutputNodeData;
  selected?: boolean;
}

function OutputNode({ data, selected }: OutputNodeProps) {
  return (
    <div
      className={`
      bg-purple-50 dark:bg-purple-900 border-2 rounded-lg shadow-md p-4 min-w-[200px]
      ${selected ? "border-purple-500 shadow-lg" : "border-purple-300 dark:border-purple-600"}
      hover:shadow-lg transition-shadow
    `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
      />

      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <i className="fas fa-flag-checkered text-purple-600 text-lg" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 dark:text-white text-sm">
            {data.label}
          </div>
          {data.outputType && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {data.outputType}
            </div>
          )}
        </div>
      </div>

      {data.config && Object.keys(data.config).length > 0 && (
        <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {Object.keys(data.config).length} config
            {Object.keys(data.config).length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

export default OutputNode;
