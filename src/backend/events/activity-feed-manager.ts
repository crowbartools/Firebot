import { app } from "electron";
import moment from "moment";
import { randomUUID } from "crypto";

import type { EventDefinition, RewardRedemptionMetadata } from "../../types";

import { EventManager } from "./event-manager";
import { FrontendChatManager } from "../chat/frontend-chat-manager";
import { SettingsManager } from "../common/settings-manager";
import rewardManager from "../channel-rewards/channel-reward-manager";
import frontendCommunicator from "../common/frontend-communicator";
import { LoggerCache } from "../logger-cache";

type FrontendActivity = {
    id: string;
    source: {
        id: string;
        name: string;
    };
    event: {
        id: string;
        name: string;
        [x: string]: unknown;
    };
    message: string;
    icon: string;
    acknowledged: boolean;
    excludeFromChatFeed: boolean;
    timestamp: string;
};

type Activity = FrontendActivity & {
    metadata: Record<string, unknown>;
    canRetrigger: boolean;
};

class ActivityFeedManager {
    private _previousActivity: Activity[] = [];
    private _logger = LoggerCache.getLogger("Activity Feed");

    isUSLocale = app.getLocale() === "en-US";
    timeFormat = this.isUSLocale ? "h:mm" : "H:mm";

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

        frontendCommunicator.onAsync("activity-feed:ui-service-ready",
            async () => this.triggerUiRefresh()
        );

        frontendCommunicator.on("activity-feed:retrigger-event", (activityId: string) => {
            const activity = this._previousActivity.find(a => a.id === activityId);
            this.retriggerActivity(activity);
        });

        frontendCommunicator.onAsync("activity-feed:get-activity-feed-supported-events", async () => {
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

        frontendCommunicator.onAsync("activity-feed:toggle-activity-acknowledged",
            async (activityId: string) => this.toggleActivityAcknowledged(activityId)
        );

        frontendCommunicator.onAsync("activity-feed:toggle-acknowledged-for-all",
            async () => this.toggleAcknowledgedForAll()
        );

        frontendCommunicator.onAsync("activity-feed:clear-all-activities",
            async () => this.clearAllActivities()
        );
    }

    private formatActivityForFrontend(activity: Activity): FrontendActivity {
        return {
            id: activity.id,
            source: activity.source,
            event: activity.event,
            message: activity.message,
            icon: activity.icon,
            acknowledged: activity.acknowledged,
            excludeFromChatFeed: activity.excludeFromChatFeed,
            timestamp: activity.timestamp
        };
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

        const newActivity: Activity = {
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
            timestamp: moment().format(this.timeFormat),
            metadata: metadata,
            canRetrigger: eventSettings.canRetrigger
        };

        this._previousActivity.unshift(newActivity);

        if (this._previousActivity.length > 500) {
            this._previousActivity.length = 500;
        }


        if (SettingsManager.getSetting("ShowActivityFeedEventsInChat") === true
            && SettingsManager.getSetting("AllowedActivityEvents").includes(`${newActivity.source.id}:${newActivity.event.id}`)
            && newActivity.excludeFromChatFeed !== true
        ) {
            FrontendChatManager.sendAlertToDashboard(newActivity.message, newActivity.icon);
        }

        frontendCommunicator.send("activity-feed:event-activity", this.formatActivityForFrontend(newActivity));
    }

    retriggerLastActivity() {
        const allowedEvents = SettingsManager.getSetting("AllowedActivityEvents");
        const lastRetriggerableActivity = this._previousActivity
            .find(a => a.canRetrigger && allowedEvents
                .includes(`${a.source.id}:${a.event.id}`));
        this.retriggerActivity(lastRetriggerableActivity);
    }

    private retriggerActivity(activity: Activity): void {
        if (activity == null) {
            return;
        }

        if (activity.event.id === "channel-reward-redemption") {
        // Manually triggered by streamer, must pass in userId and userDisplayName can be falsy
            const metadata: Record<string, unknown> =
                { userId: "", userDisplayName: "", ...activity.metadata };
            void rewardManager.triggerChannelReward(
                (activity.metadata as RewardRedemptionMetadata).rewardId,
                metadata as RewardRedemptionMetadata
            );
        }

        void EventManager.triggerEvent(activity.source.id, activity.event.id,
            activity.metadata, false, true, false);
    }

    private toggleActivityAcknowledged(activityId: string): void {
        const activity = this._previousActivity.find(a => a.id === activityId);

        if (activity) {
            activity.acknowledged = !activity.acknowledged;
            frontendCommunicator.send("activity-feed:activity-updated", this.formatActivityForFrontend(activity));
        }
    }

    updateAcknowledgedForAll(acknowledged: boolean): void {
        this._previousActivity.forEach((a) => {
            a.acknowledged = acknowledged;
        });

        this.triggerUiRefresh();
    }

    private toggleAcknowledgedForAll(): void {
        this.updateAcknowledgedForAll(this._previousActivity.some(a => a.acknowledged !== true));
    }

    private clearAllActivities(): void {
        this._previousActivity = [];
        this.triggerUiRefresh();
    }

    triggerUiRefresh(): void {
        this._logger.debug("Triggering UI refresh");
        frontendCommunicator.send("activity-feed:all-items", this._previousActivity.map(this.formatActivityForFrontend));
    }
}

const manager = new ActivityFeedManager();

export { manager as ActivityFeedManager };