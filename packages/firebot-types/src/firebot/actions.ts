export interface Action<M = Record<string, unknown>> {
  id: string;
  name: string;
  type: string;
  metadata: M;
}

export interface ActionFlow {
  id: string;
  actions: Action[];
}
