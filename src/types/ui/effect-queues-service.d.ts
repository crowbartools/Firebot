import type { EffectQueueConfig } from "../../types";

export type EffectQueuesService = {
    getEffectQueues: () => EffectQueueConfig[];
    getEffectQueue: (id: string) => EffectQueueConfig | undefined;
    showAddEditEffectQueueModal: (queueId?: string) => Promise<string>;
    showDeleteEffectQueueModal: (queueId: string) => Promise<boolean>;
    queueModes: { value: string, label: string, description: string, iconClass: string }[];
};