import { FirebotActionWorkflow } from "../actions";

export interface EventFilter {
    id?: string;
    type: string;
    comparisonType?: string;
    value?: unknown;
}

export interface EventSourceEventDefinition {
    id: string;
    name: string;
    description?: string;
    supportsManualMetadata?: boolean;
}

export interface EventSourceDefinition {
    id: string;
    name: string;
    description?: string;
    events: EventSourceEventDefinition[];
}

export interface EventConfig {
    id: string;
    name?: string;
    description?: string;
    sourceId: string;
    eventId: string;
    active: boolean;
    manualMetadata?: Record<string, unknown>;
    filters?: EventFilter[];
    actionWorkflow: FirebotActionWorkflow;
}

export interface EventGroup {
    id: string;
    name: string;
    active: boolean;
    events: EventConfig[];
}

export interface EventConfigsSettings {
    mainEvents: EventConfig[];
    groups: EventGroup[];
    sortTags: string[];
}
