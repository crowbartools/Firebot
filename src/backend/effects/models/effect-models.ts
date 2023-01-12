import { EffectCategory } from "../../../shared/effect-constants";
import ng from "angular";

interface EffectScope<EffectModel> extends ng.IScope {
    effect: EffectModel;
    [x: string]: unknown;
};

export type TriggerType =
    | "command"
    | "custom_script"
    | "startup_script"
    | "api"
    | "event"
    | "hotkey"
    | "timer"
    | "counter"
    | "preset"
    | "quick_action"
    | "manual";

export type Trigger = {
    type: TriggerType;
    metadata: {
        username: string;
        hotkey?: any;
        command?: any;
        userCommand?: { trigger: string; args: string[] };
        chatMessage?: any;
        event?: { id: string; name: string };
        eventSource?: { id: string; name: string };
        eventData?: Record<string, unknown>;
        [x: string]: unknown;
    };
};

export type TriggersObject = {
    [T in TriggerType]?: T extends "event" ? string[] | boolean : boolean;
};

export type EffectTriggerResponse = {
    success: boolean;
    execution?: {
        stop: boolean;
        bubbleStop: boolean;
    };
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