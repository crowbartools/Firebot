"use client";

import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider,
  ConnectionLineType,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Import our custom node types
import ActionNode from "./nodes/ActionNode";
import TriggerNode from "./nodes/TriggerNode";
import OutputNode from "./nodes/OutputNode";
import NewActionPlaceholderNode from "./nodes/NewActionPlaceholderNode";
import { ControlsPanel } from "./controls/ControlsPanel";
import {
  ActionWorkflowEditorProvider,
  useActionWorkflowEditor,
} from "./ActionWorkflowEditorContext";
import { Separator } from "../ui/separator";
import { WorkflowSidebar } from "./sidebar/WorkflowSidebar";
import { CustomSmoothStepEdge } from "./edges/CustomSmoothStepEdge";
import { ActionTriggerType, FirebotActionWorkflow } from "firebot-types";

// Node types for React Flow
const nodeTypes = {
  action: ActionNode,
  trigger: TriggerNode,
  output: OutputNode,
  placeholder: NewActionPlaceholderNode,
};

interface ActionEditorProps {
  triggerType: ActionTriggerType;
  workflow: FirebotActionWorkflow;
  onWorkflowChange: (workflow: FirebotActionWorkflow) => void;
  className?: string;
}

const mapFirebotNodesToReactFlowNodes = (
  firebotNodes: FirebotActionWorkflow["nodes"]
): Node[] => {
  return firebotNodes
    .map((node) => {
      if (node.type === "trigger") {
        return {
          id: node.id,
          type: "trigger",
          position: node.position,
          data: { label: "Command triggered" },
        };
      } else if (node.type === "action") {
        return {
          id: node.id,
          type: "action",
          position: node.position,
          data: {
            actionType: node.actionType,
            parameters: node.schema?.parameters || {},
          },
        };
      }
      return null;
    })
    .filter(Boolean) as Node[];
};

const mapFirebotEdgesToReactFlowEdges = (
  firebotEdges: FirebotActionWorkflow["edges"]
): Edge[] => {
  return firebotEdges.map((edge) => ({
    id: edge.id,
    source: edge.source.nodeId,
    target: edge.target.nodeId,
    type: "smoothstep",
  }));
};

const mapReactFlowNodesToFirebotNodes = (
  reactFlowNodes: Node[]
): FirebotActionWorkflow["nodes"] => {
  return reactFlowNodes
    .map((node) => {
      if (node.type === "trigger") {
        return {
          id: node.id,
          type: "trigger",
          position: node.position,
        };
      } else if (node.type === "action") {
        return {
          id: node.id,
          type: "action",
          actionType: node.data.actionType,
          position: node.position,
          schema: {
            parameters: node.data.parameters || {},
          },
        };
      }
      return null;
    })
    .filter(Boolean) as FirebotActionWorkflow["nodes"];
};

const mapReactFlowEdgesToFirebotEdges = (
  reactFlowEdges: Edge[]
): FirebotActionWorkflow["edges"] => {
  return reactFlowEdges.map((edge) => ({
    id: edge.id,
    source: {
      nodeId: edge.source,
      outcome: "complete", // Assuming a single outcome for simplicity
    },
    target: {
      nodeId: edge.target,
    },
  }));
};

function ActionWorkflowEditor({
  className,
  workflow,
  onWorkflowChange,
}: ActionEditorProps) {
  const [nodes, setNodes] = useState(
    mapFirebotNodesToReactFlowNodes(workflow.nodes)
  );
  const [edges, setEdges] = useState(
    mapFirebotEdgesToReactFlowEdges(workflow.edges)
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const newNodes = applyNodeChanges(changes, nodes);
      setNodes(newNodes);
      onWorkflowChange({
        ...workflow,
        nodes: mapReactFlowNodesToFirebotNodes(newNodes),
        edges: mapReactFlowEdgesToFirebotEdges(edges),
      });
    },
    [nodes, edges, onWorkflowChange, workflow]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const newEdges = applyEdgeChanges(changes, edges);
      setEdges(newEdges);
      onWorkflowChange({
        ...workflow,
        nodes: mapReactFlowNodesToFirebotNodes(nodes),
        edges: mapReactFlowEdgesToFirebotEdges(newEdges),
      });
    },
    [edges, onWorkflowChange, workflow, nodes]
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
          },
          eds
        )
      ),
    []
  );

  const proOptions = { hideAttribution: true };

  const { cursorMode } = useActionWorkflowEditor();

  return (
    <ReactFlowProvider>
      <div className={`w-full h-full bg-accent flex ${className || ""}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={{
            smoothstep: CustomSmoothStepEdge,
          }}
          connectionLineType={ConnectionLineType.SmoothStep}
          proOptions={proOptions}
          className="grow"
          colorMode="dark"
          selectionMode={SelectionMode.Partial}
          selectionOnDrag={cursorMode === "pointer"}
          panOnDrag={cursorMode === "drag"}
          fitView
          fitViewOptions={{ maxZoom: 1 }}
        >
          <ControlsPanel />
          <Background gap={20} size={1} />
        </ReactFlow>
        <Separator orientation="vertical" className="" />
        <WorkflowSidebar />
      </div>
    </ReactFlowProvider>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withActionWorkflowEditor(Component: typeof ActionWorkflowEditor) {
  return function WrappedComponent(
    props: React.ComponentProps<typeof ActionWorkflowEditor>
  ) {
    return (
      <ActionWorkflowEditorProvider
        workflow={props.workflow as FirebotActionWorkflow}
      >
        <Component {...props} />
      </ActionWorkflowEditorProvider>
    );
  };
}

export default withActionWorkflowEditor(ActionWorkflowEditor);
