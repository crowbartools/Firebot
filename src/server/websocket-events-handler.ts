import { TypedEmitter } from "tiny-typed-emitter";
import webSocketServerManager from "./websocket-server-manager";

// Firebot Component Managers
import { CommandManager } from "../backend/chat/commands/command-manager";
import { CounterManager } from "../backend/counters/counter-manager";
import { CustomVariableManager } from "../backend/common/custom-variable-manager";
import { EffectQueueConfigManager } from "../backend/effects/queues/effect-queue-config-manager";
import { PresetEffectListManager } from "../backend/effects/preset-lists/preset-effect-list-manager";
import { QuoteManager } from "../backend/quotes/quote-manager";
import { TimerManager } from "../backend/timers/timer-manager";
import customRolesManager from "../backend/roles/custom-roles-manager";
import effectQueueRunner from "../backend/effects/queues/effect-queue-runner";
import viewerMetadataManager from "../backend/viewers/viewer-metadata-manager";

type ComponentEvents = {
    "created-item": (item: any) => void;
    "updated-item": (item: any) => void;
    "deleted-item": (item: any) => void;
};

type EffectQueueRunnerEvents = {
    "length-updated": (item: unknown) => void;
};

type Events = ComponentEvents & EffectQueueRunnerEvents;

type ComponentManager = {
    componentName: string;
    manager: TypedEmitter<any>;
    eventNameOverrides?: Array<[keyof Events, string]>;
};

const FIREBOT_COMPONENT_MANAGERS: Array<ComponentManager> = [
    {
        componentName: "command",
        manager: CommandManager
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
        manager: CustomVariableManager
    },
    {
        componentName: "effect-queue",
        manager: EffectQueueConfigManager
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
        manager: PresetEffectListManager
    },
    {
        componentName: "quote",
        manager: QuoteManager.events
    },
    {
        componentName: "timer",
        manager: TimerManager
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
    for (const { componentName, manager, eventNameOverrides } of FIREBOT_COMPONENT_MANAGERS) {
        for (const [managerEvent, webSocketEvent] of eventNameOverrides ?? MANAGER_EVENT_MAP) {
            manager.on(managerEvent, (item) => {
                webSocketServerManager.triggerEvent(`${componentName}:${webSocketEvent}`, item);
            });
        }
    }
}