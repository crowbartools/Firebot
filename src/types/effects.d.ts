import ng from "angular";
import type { TriggerType, TriggersObject, Trigger } from "./triggers";
import type { Awaitable } from "./util-types";

type Func<T> = (...args: unknown[]) => T;

interface EffectScope<EffectModel> extends ng.IScope {
    effect: EffectModel;
    [x: string]: any;
}

export type EffectCategory =
    | "common"
    | "twitch"
    | "moderation"
    | "chat based"
    | "dashboard"
    | "overlay"
    | "fun"
    | "integrations"
    | "firebot control"
    | "advanced"
    | "scripting";

export type EffectTriggerResponse = {
    success: boolean;
    execution?: {
        stop: boolean;
        bubbleStop: boolean;
    };
    outputs?: {
        [x as string]: unknown;
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

export type OverlayExtension<OverlayData = unknown> = {
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

export type OverlayDimensions = {
    width: number;
    height: number;
};

export type OverlayPosition = {
    position: string;
    customCoords?: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
};

export type OverlayRotation = {
    rotation: number;
    rotType: "deg" | "rad" | "turn";
};

export type OverlayEnterExitAnimations = {
    enterAnimation: string;
    enterDuration: number;

    inbetweenAnimation: string;
    inbetweenDuration: number;
    inbetweenDelay: number;
    inbetweenRepeat: number;

    exitAnimation: string;
    exitDuration: number;
};

export type OverlayInstance = {
    overlayInstance: string;
};

export type EffectDefinition<EffectModel = unknown> = {
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
    /**
     * If true, this effect does nothing when triggered (ex Comment effect)
     * No-op effects are ignored by the random and sequential effects
     */
    isNoOp?: boolean;
};

export type EffectInstance<EffectModel = unknown> = {
    id: string;
    type: string;
    effectLabel?: string | null;
    effectComment?: string | null;
    active?: boolean;
    abortTimeout?: number | null;
    percentWeight?: number | null;
    outputNames?: Record<string, string>;
} & {
    [K in keyof EffectModel]: EffectModel[K];
} & {
    [x: string]: unknown;
};

export type EffectType<EffectModel = unknown, OverlayData = unknown> = {
    definition: EffectDefinition<EffectModel>;
    optionsTemplate: string;
    optionsTemplateUrl?: string;
    optionsController?: ($scope: EffectScope<EffectModel>, ...args: any[]) => void;
    optionsValidator?: (effect: EffectModel, $scope: EffectScope<EffectModel>) => string[];
    getDefaultLabel?: (effect: EffectModel, ...args: any[]) => Awaitable<string | undefined>;
    onTriggerEvent: (event: {
        effect: EffectInstance<EffectModel>;
        trigger: Trigger;
        sendDataToOverlay: (data: OverlayData, overlayInstance?: string) => void;
        outputs: Record<string, unknown>;
        abortSignal: AbortSignal;
    }) => Awaitable<void | boolean | EffectTriggerResponse>;
    overlayExtension?: OverlayExtension<OverlayData>;
};

export type EffectListRunMode = "all" | "random" | "sequential";

export interface EffectList {
    id: string;
    list: EffectInstance[];
    queue?: string | null;
    queuePriority?: "high" | "none";
    queueDuration?: number;
    runMode?: EffectListRunMode;
    weighted?: boolean;
    dontRepeatUntilAllUsed?: boolean;
}

export type PresetEffectList = {
    id: string;
    name: string;
    args: Array<{
        name: string;
    }>;
    effects: EffectList;
    sortTags: string[];
};

type QueueMode = "auto" | "interval" | "custom" | "manual";

export type EffectQueueConfig = {
    id: string;
    name: string;
    mode: QueueMode;
    interval?: number;
    sortTags: string[];
    active: boolean;
    runEffectsImmediatelyWhenPaused: boolean;
    length: number;
    queue: any[];
};

export type QueueStatus = "running" | "paused" | "idle" | "canceled";

export type RunEffectsContext = {
    trigger: Trigger;
    effects: EffectList;
    outputs?: {
        [x: string]: unknown;
    };
    [key: string]: unknown;
};

type QueueItem = {
    runEffectsContext: RunEffectsContext;
    duration?: number;
    priority?: "none" | "high";
};

export type QueueState = {
    status: QueueStatus;
    queuedItems: QueueItem[];
    activeItems: QueueItem[];
    interval: number;
    mode: QueueMode;
    runEffectsImmediatelyWhenPaused?: boolean;
};