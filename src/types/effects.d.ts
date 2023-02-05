import { TriggerType, TriggersObject, Trigger } from "./triggers";
import ng from "angular";

interface EffectScope<EffectModel> extends ng.IScope {
    effect: EffectModel;
    [x: string]: unknown;
};

export type EffectCategory = 
    | "common"
    | "twitch"
    | "chat based"
    | "Moderation"
    | "overlay"
    | "fun"
    | "integrations"
    | "advanced"
    | "scripting";

export type EffectTriggerResponse = {
    success: boolean;
    execution?: {
        stop: boolean;
        bubbleStop: boolean;
    };
};

export type EffectOutput = {
    label: string;
    description: string;
    defaultName: string;
};

export type EffectType<EffectModel, OverlayData = unknown> = {
    definition: {
        id: string;
        name: string;
        description: string;
        icon: string;
        categories: EffectCategory[];
        triggers?: TriggerType[] | TriggersObject;
        dependencies?: Array<"chat">;
        outputs?: EffectOutput[];
    };
    optionsTemplate: string;
    optionsController?: (
        $scope: EffectScope<EffectModel>,
        ...args: unknown[]
    ) => void;
    optionsValidator?: (effect: EffectModel) => string[];
    onTriggerEvent: (event: {
        effect: EffectModel;
        trigger: Trigger;
        sendDataToOverlay: (
            data: OverlayData,
            overlayInstance?: string
        ) => void;
    }) => Promise<void | boolean | EffectTriggerResponse>;
    overlayExtension?: {
        dependencies?: {
            globalStyles?: string;
            css?: string[];
            js?: string[];
        };
        event: {
            name: string;
            onOverlayEvent: (data: OverlayData) => void;
        };
    };
};

export interface EffectList {
    id: string,
    list: any[]
};