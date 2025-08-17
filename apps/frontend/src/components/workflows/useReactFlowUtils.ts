import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

export function useReactFlowUtils() {
  const { setNodes, setEdges, getNodes } = useReactFlow();

  const unselectAll = useCallback(() => {
    setNodes((nodes) => nodes.map((node) => ({ ...node, selected: false })));
    setEdges((edges) => edges.map((edge) => ({ ...edge, selected: false })));
  }, [setNodes, setEdges]);

  const replacePlaceholderWithActionNode = useCallback(
    (data: { actionType: string }) => {
      const nodes = getNodes();
      const placeholderNode = nodes.find((node) => node.type === "placeholder");

      if (placeholderNode) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === placeholderNode.id
              ? {
                  ...placeholderNode,
                  type: "action",
                  data: {
                    ...data,
                    parameters: {},
                  },
                }
              : node
          )
        );
      }
    },
    [getNodes, setNodes]
  );

  return {
    unselectAll,
    replacePlaceholderWithActionNode,
  };
}
