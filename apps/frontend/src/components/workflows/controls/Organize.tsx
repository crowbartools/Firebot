import Dagre from "@dagrejs/dagre";

import React, { useCallback } from "react";
import { useReactFlow, Node, Edge, useNodes, useEdges } from "@xyflow/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Network } from "lucide-react";

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  // TB = Top to Bottom
  g.setGraph({ rankdir: "TB" });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    })
  );

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      const x = position.x - (node.measured?.width ?? 0) / 2;
      const y = position.y - (node.measured?.height ?? 0) / 2;

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

export function Organize() {
  const { fitView, setNodes, setEdges } = useReactFlow();

  const nodes = useNodes();
  const edges = useEdges();

  const organizeLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges);

    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);

    fitView();
  }, [nodes, edges, setNodes, setEdges, fitView]);

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={organizeLayout}
        >
          <Network />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Organize</p>
      </TooltipContent>
    </Tooltip>
  );
}
