export type TriggerType = "command";

export interface Trigger<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  type: TriggerType;
  id: string;
  name: string;
  description?: string;
  metadata: Metadata;
  actions: any[];
}
