import { TypedEmitter } from "tiny-typed-emitter";
import webSocketServerManager from "./websocket-server-manager";

// Firebot Component Managers
import commandManager from "../backend/chat/commands/command-manager";
import { CounterManager } from "../backend/counters/counter-manager";
import customRolesManager from "../backend/roles/custom-roles-manager";
import { events as customVariablesEvents } from "../backend/common/custom-variable-manager";
import effectQueueManager from "../backend/effects/queues/effect-queue-config-manager";
import effectQueueRunner from "../backend/effects/queues/effect-queue-runner";
import presetEffectListManager from "../backend/effects/preset-lists/preset-effect-list-manager";
import { events as quotesEvents } from "../backend/quotes/quotes-manager";
import timerManager from "../backend/timers/timer-manager";
import viewerMetadataManager from "../backend/viewers/viewer-metadata-manager";

type ComponentEvents = {
    "created-item": (item: any) => void;
    "updated-item": (item: any) => void;
    "deleted-item": (item: any) => void;
};

type EffectQueueRunnerEvents = {
    "length-updated": (item: unknown) => void;
}

type Events = ComponentEvents & EffectQueueRunnerEvents;

type ComponentManager = {
    componentName: string;
    manager: TypedEmitter<any>;
    eventNameOverrides?: Array<[keyof Events, string]>;
}

const FIREBOT_COMPONENT_MANAGERS: Array<ComponentManager> = [
    {
        componentName: "command",
        manager: commandManager
    },
    {
        componentName: "counter",
        manager: CounterManager
    },
    {
        componentName: "custom-role",
        manager: customRolesManager
    },
    {
        componentName: "custom-variable",
        manager: customVariablesEvents
    },
    {
        componentName: "effect-queue",
        manager: effectQueueManager
    },
    {
        componentName: "effect-queue",
        manager: effectQueueRunner,
        eventNameOverrides: [
            ["length-updated", "length-updated"]
        ]
    },
    {
        componentName: "preset-effect-list",
        manager: presetEffectListManager
    },
    {
        componentName: "quote",
        manager: quotesEvents
    },
    {
        componentName: "timer",
        manager: timerManager
    },
    {
        componentName: "viewer-metadata",
        manager: viewerMetadataManager
    }
];

const MANAGER_EVENT_MAP: Array<[keyof ComponentEvents, string]> = [
    ["created-item", "created"],
    ["updated-item", "updated"],
    ["deleted-item", "deleted"]
];

export function createComponentEventListeners() {
    for (const {componentName, manager, eventNameOverrides} of FIREBOT_COMPONENT_MANAGERS) {
        for (const [managerEvent, webSocketEvent] of eventNameOverrides ?? MANAGER_EVENT_MAP) {
            manager.on(managerEvent, (item) => {
                webSocketServerManager.triggerEvent(`${componentName}:${webSocketEvent}`, item);
            });
        }
    }
}