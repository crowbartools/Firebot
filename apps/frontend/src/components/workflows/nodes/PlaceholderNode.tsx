import React, { useCallback, ReactNode, forwardRef } from "react";
import {
  useReactFlow,
  useNodeId,
  NodeProps,
  Handle,
  Position,
  useOnSelectionChange,
  OnSelectionChangeParams,
} from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export type PlaceholderNodeProps = Partial<NodeProps> & {
  children?: ReactNode;
};

export const PlaceholderNode = forwardRef<HTMLDivElement, PlaceholderNodeProps>(
  ({ children }, ref) => {
    const id = useNodeId();
    const { setNodes, setEdges } = useReactFlow();

    // the passed handler has to be memoized, otherwise the hook will not work correctly
    const onChange = useCallback(
      ({ nodes }: OnSelectionChangeParams) => {
        if (nodes.length === 1 && nodes[0].id === id) {
          return;
        }

        setEdges((edges) => edges.filter((edge) => edge.target !== id));
        setNodes((nodes) => nodes.filter((node) => node.id !== id));
      },
      [id, setEdges, setNodes]
    );

    useOnSelectionChange({
      onChange,
    });

    return (
      <BaseNode
        ref={ref}
        className="w-62 border-dashed border-gray-400 bg-card p-2 text-center text-gray-400 shadow-none"
      >
        {children}
        <Handle
          type="target"
          style={{ visibility: "hidden", top: "-3px" }}
          position={Position.Top}
          isConnectable={false}
        />
        <Handle
          type="source"
          style={{ visibility: "hidden" }}
          position={Position.Bottom}
          isConnectable={false}
        />
      </BaseNode>
    );
  }
);

PlaceholderNode.displayName = "PlaceholderNode";
