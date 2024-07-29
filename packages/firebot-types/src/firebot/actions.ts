export interface Action<M = Record<string, unknown>> {
  id: string;
  name: string;
  type: string;
  metadata: M;
}

export interface ActionFlow {
  id: string;
  queue: {
    id: string;
    duration: number;
  };
  nodes: Array<{
    id: string;
    position: {
      x: number;
      y: number;
    };
    action: Action;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}
