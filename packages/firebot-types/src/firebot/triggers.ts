import { FirebotActionWorkflow } from "../actions";

export interface TriggerFilter {
    id?: string;
    type: string;
    comparisonType?: string;
    value?: unknown;
}

export interface TriggerSourceEventDefinition {
    id: string;
    name: string;
    description?: string;
    supportsManualMetadata?: boolean;
}

export interface TriggerSourceDefinition {
    id: string;
    name: string;
    description?: string;
    events: TriggerSourceEventDefinition[];
}

export interface TriggerConfig {
    id: string;
    name?: string;
    description?: string;
    sourceId: string;
    eventId: string;
    active: boolean;
    manualMetadata?: Record<string, unknown>;
    filters?: TriggerFilter[];
    actionWorkflow: FirebotActionWorkflow;
}

export interface TriggerGroup {
    id: string;
    name: string;
    active: boolean;
    triggers: TriggerConfig[];
}

export interface TriggerConfigsSettings {
    mainTriggers: TriggerConfig[];
    groups: TriggerGroup[];
    sortTags: string[];
}