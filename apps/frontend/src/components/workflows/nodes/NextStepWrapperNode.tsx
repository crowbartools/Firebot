import {
  Edge,
  Handle,
  Node,
  NodeProps,
  Position,
  useNodeConnections,
  useNodeId,
  useReactFlow,
} from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { ButtonHandle } from "./ButtonHandle";
import { useHoverDirty } from "react-use";
import { RefObject, useCallback, useRef } from "react";
import * as Headless from "@headlessui/react";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { v4 as uuid } from "uuid";

type Props = {
  children: React.ReactNode;
  className?: string;
  showTopHandle?: boolean;
} & Partial<NodeProps>;

export function NextStepWrapperNode({
  children,
  className,
  selected,
  positionAbsoluteX,
  positionAbsoluteY,
  showTopHandle,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const connections = useNodeConnections({
    handleType: "source",
  });

  const isHovering = useHoverDirty(ref as RefObject<HTMLDivElement>);

  const nodeId = useNodeId();

  const { setNodes, setEdges } = useReactFlow();

  const onNewPress = useCallback(() => {
    const newNode: Node = {
      id: uuid(),
      type: "placeholder",
      position: {
        x: positionAbsoluteX ?? 0,
        y: (positionAbsoluteY ?? 0) + 150, // Adjust position below the current node
      },
      selected: true,
      data: {},
    };
    setNodes((nodes) => [
      ...nodes.map((n) => ({
        ...n,
        selected: false,
      })),
      newNode,
    ]);
    const newEdge: Edge = {
      id: uuid(),
      source: nodeId!,
      target: newNode.id,
      type: "smoothstep",
    };
    setEdges((edges) => [
      ...edges.map((e) => ({
        ...e,
        selected: false,
      })),
      newEdge,
    ]);
  }, [positionAbsoluteX, positionAbsoluteY, setNodes, setEdges, nodeId]);

  return (
    <BaseNode ref={ref} className={className}>
      {showTopHandle == true && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3! h-3! !bg-blue-500 border-2 border-white top-[-2px]! opacity-0!"
        />
      )}

      {children}

      <ButtonHandle
        type="source"
        position={Position.Bottom}
        showButton={connections.length == 0 && (selected || isHovering)}
        className="z-10"
      >
        <Headless.Button
          onClick={onNewPress}
          className={cn(
            "cursor-pointer rounded-full bg-blue-500 p-1 hover:bg-blue-400"
          )}
          ref={ref}
        >
          <PlusIcon className="h-3 w-3 text-white" />
        </Headless.Button>
      </ButtonHandle>

      <div
        className="nodrag poi"
        style={{
          cursor: "default",
          position: "absolute",
          left: "25%",
          right: "25%",
          height: "45%",
          clipPath: "polygon(0px 0px, 100% 0px, 75% 100%, 25% 100%)",
          top: "100%",
        }}
      ></div>
    </BaseNode>
  );
}
