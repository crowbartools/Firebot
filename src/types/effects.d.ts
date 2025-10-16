import ng from "angular";
import { TriggerType, TriggersObject, Trigger } from "./triggers";
import { Awaitable } from "./util-types";

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
        /**
         * If true, this effect cannot be aborted via the "Timeout" feature
         */
        exemptFromTimeouts?: boolean;
        /**
         * Keys of the effect model that should be exempt from having variables replaced in them automatically.
         * This is useful when you want to run variable replacement manually, or not at all.
         */
        keysExemptFromAutoVariableReplacement?: Array<keyof EffectModel>;
    };
    optionsTemplate: string;
    optionsController?: ($scope: EffectScope<EffectModel>, ...args: any[]) => void;
    optionsValidator?: (effect: EffectModel, $scope: EffectScope<EffectModel>) => string[];
    getDefaultLabel?: (effect: EffectModel, ...args: any[]) => Awaitable<string | undefined>;
    onTriggerEvent: (event: {
        effect: EffectModel;
        trigger: Trigger;
        sendDataToOverlay: (data: OverlayData, overlayInstance?: string) => void;
        outputs: Record<string, unknown>;
        abortSignal: AbortSignal;
    }) => Awaitable<void | boolean | EffectTriggerResponse>;
    overlayExtension?: OverlayExtension;
};

export interface EffectInstance {
    id: string;
    type: string;
    [x: string]: unknown;
}

export interface EffectList {
    id: string;
    list: EffectInstance[];
}
