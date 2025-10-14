import { EffectList } from "./effects";
import { Awaitable } from "./util-types";

export type QuickActionDefinition = {
    id: string;
    name: string;
    type: "system" | "custom";
    icon: string;
    presetListId?: string;
    presetArgValues?: Record<string, unknown>;
    promptForArgs?: boolean;
    effectList?: EffectList;
};

export type SystemQuickAction = {
    definition: QuickActionDefinition;
    onTriggerEvent(): Awaitable<void>;
};