type FirebotBaseNode = {
  id: string;
  description?: string;
  position: {
    x: number;
    y: number;
  };
};

type FirebotTriggerNode = FirebotBaseNode & {
  type: "trigger";
  schema: {
    outcomes: [
      {
        slug: "triggered";
      },
    ];
  };
};

type FirebotActionNode = FirebotBaseNode & {
  type: "action";
  actionType: string;
  parentSubgraphId?: string;
  schema?: {
    parameters?: Record<string, unknown>;
    outputs?: Array<{
      slug: string;
    }>;
    outcomes?: Array<{
      slug: string;
    }>;
    subgraphs?: Array<{
      slug: string;
    }>;
  };
};

export type FirebotEdge = {
  id: string;
  source: {
    nodeId: string;
    outcome: string;
  };
  target: {
    nodeId: string;
  };
};

export interface FirebotActionWorkflow {
  id: string;
  queue?: {
    id: string;
    duration: number;
  };
  nodes: Array<FirebotTriggerNode | FirebotActionNode>;
  edges: Array<FirebotEdge>;
}
