import { app } from "electron";
import moment from "moment";
import { randomUUID } from "crypto";

import type { EventDefinition } from "../../types/events";
import type { RewardRedemptionMetadata } from "../../types/channel-rewards";

import { EventManager } from "./event-manager";
import { SettingsManager } from "../common/settings-manager";
import rewardManager from "../channel-rewards/channel-reward-manager";
import frontendCommunicator from "../common/frontend-communicator";

type Activity = {
    id: string;
    sourceId: string;
    eventId: string;
    metadata: Record<string, unknown>;
    canRetrigger: boolean;
};

class ActivityFeedManager {
    isUSLocale = app.getLocale() === "en-US";
    timeFormat = this.isUSLocale ? "h:mm" : "H:mm";

    private _previousActivity: Activity[] = [];

    constructor() {
        EventManager.on("event-triggered", ({
            event,
            source,
            meta,
            isManual,
            isRetrigger
        }) => {
            if (isManual || isRetrigger) {
                return;
            }
            this.handleTriggeredEvent(source, event, meta);
        });

        frontendCommunicator.on("activity-feed:retrigger-event", (activityId: string) => {
            const activity = this._previousActivity.find(a => a.id === activityId);
            this.retriggerActivity(activity);
        });

        frontendCommunicator.on("activity-feed:get-activity-feed-supported-events", () => {
            return EventManager
                .getAllEventSources()
                .map(es =>
                    es.events
                        .filter(e => e.activityFeed != null)
                        .map(e => (
                            {
                                eventId: e.id,
                                eventName: e.name,
                                sourceId: es.id,
                                sourceName: es.name
                            }
                        )))
                .flat()
                .filter(e => e != null) ?? [];
        });
    }

    handleTriggeredEvent(
        source: { id: string, name: string },
        event: Pick<EventDefinition, "id" | "name" | "activityFeed">,
        metadata: Record<string, unknown>,
        eventSettings = { forceAllow: false, canRetrigger: true }
    ): void {
        if (source == null || event == null || metadata == null) {
            return;
        }

        if (event.activityFeed == null ||
        event.activityFeed.getMessage == null) {
            return;
        }

        const activityId = randomUUID();

        this._previousActivity.unshift({
            id: activityId,
            eventId: event.id,
            sourceId: source.id,
            metadata: metadata,
            canRetrigger: eventSettings.canRetrigger
        });

        if (this._previousActivity.length > 500) {
            this._previousActivity.length = 500;
        }

        frontendCommunicator.send("activity-feed:event-activity", {
            id: activityId,
            source: {
                id: source.id,
                name: source.name
            },
            event: {
                id: event.id,
                name: event.name,
                ...eventSettings
            },
            message: event.activityFeed.getMessage(metadata),
            icon: event.activityFeed.icon,
            acknowledged: false,
            excludeFromChatFeed: event.activityFeed.excludeFromChatFeed,
            timestamp: moment().format(this.timeFormat)
        });
    }

    retriggerLastActivity() {
        const allowedEvents = SettingsManager.getSetting("AllowedActivityEvents");
        const lastRetriggerableActivity = this._previousActivity
            .find(a => a.canRetrigger && allowedEvents
                .includes(`${a.sourceId}:${a.eventId}`));
        this.retriggerActivity(lastRetriggerableActivity);
    }

    private retriggerActivity(activity: Activity): void {
        if (activity == null) {
            return;
        }

        if (activity.eventId === "channel-reward-redemption") {
        // Manually triggered by streamer, must pass in userId and userDisplayName can be falsy
            const metadata: Record<string, unknown> =
                { userId: "", userDisplayName: "", ...activity.metadata };
            void rewardManager.triggerChannelReward(
                (activity.metadata as RewardRedemptionMetadata).rewardId,
                metadata as RewardRedemptionMetadata
            );
        }

        void EventManager.triggerEvent(activity.sourceId, activity.eventId,
            activity.metadata, false, true, false);
    }
}

const manager = new ActivityFeedManager();

export { manager as ActivityFeedManager };