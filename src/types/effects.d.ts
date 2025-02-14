import { TriggerType, TriggersObject, Trigger } from "./triggers";
import ng from "angular";

type Func<T> = (...args: unknown[]) => T;

interface EffectScope<EffectModel> extends ng.IScope {
    effect: EffectModel;
    [x: string]: any;
}

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

export type EffectDependencies = {
    twitch?: boolean;
    integrations?: Record<string, boolean>;
};

export type OverlayExtension = {
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

export type EffectType<EffectModel = unknown, OverlayData = unknown> = {
    definition: {
        id: string;
        name: string;
        description: string;
        icon: string;
        categories: EffectCategory[];
        hidden?: boolean | Func<boolean>;
        triggers?: TriggerType[] | TriggersObject;
        dependencies?: EffectDependencies | Array<"chat">;
        showWhenDependenciesNotMet?: boolean;
        outputs?: EffectOutput[];
    };
    optionsTemplate: string;
    optionsController?: ($scope: EffectScope<EffectModel>, ...args: any[]) => void;
    optionsValidator?: (effect: EffectModel, $scope: EffectScope<EffectModel>) => string[];
    getDefaultLabel?: (effect: EffectModel, ...args: any[]) => string | undefined | Promise<string | undefined>;
    onTriggerEvent: (event: {
        effect: EffectModel;
        trigger: Trigger;
        sendDataToOverlay: (data: OverlayData, overlayInstance?: string) => void;
    }) => Promise<void | boolean | EffectTriggerResponse>;
    overlayExtension?: OverlayExtension;
};

export interface EffectList {
    id: string;
    list: any[];
}
