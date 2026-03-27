import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { TriggersService } from "./triggers.service";
import { TRIGGER_EVENT_BRIDGES_BY_EMITTER } from "./trigger-event-bridges";
import { TriggerEventBridge } from "./trigger-event-bridge.types";

@Injectable()
export class TriggerListenerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TriggerListenerService.name);
    private readonly subscriptions: Array<{
        emitterEvent: string;
        handler: (payload: unknown) => void;
    }> = [];

    constructor(
        private readonly triggersService: TriggersService,
        private readonly eventEmitter: EventEmitter2
    ) { }

    onModuleInit(): void {
        for (const [emitterEvent, bridges] of TRIGGER_EVENT_BRIDGES_BY_EMITTER.entries()) {
            const handler = (payload: unknown) => {
                void this.dispatchEmitterEvent(bridges, payload);
            };

            this.eventEmitter.on(emitterEvent, handler);
            this.subscriptions.push({ emitterEvent, handler });
        }
    }

    onModuleDestroy(): void {
        for (const { emitterEvent, handler } of this.subscriptions) {
            this.eventEmitter.off(emitterEvent, handler);
        }
        this.subscriptions.length = 0;
    }

    private async dispatchEmitterEvent(
        bridges: TriggerEventBridge[],
        payload: unknown
    ): Promise<void> {
        for (const bridge of bridges) {
            await this.handleBridgeEvent(bridge, payload);
        }
    }

    private async handleBridgeEvent(
        bridge: TriggerEventBridge,
        payload: unknown
    ): Promise<void> {
        try {
            if (bridge.shouldHandle && !bridge.shouldHandle(payload)) {
                return;
            }

            await this.triggersService.fireTriggersBySourceEvent(
                bridge.sourceId,
                bridge.eventId
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(
                `Trigger bridge '${bridge.id}' failed for event '${bridge.emitterEvent}': ${message}`
            );
        }
    }
}
