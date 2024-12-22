"use strict";
const app = require('electron').app;
const moment = require("moment");
const { v4: uuid } = require("uuid");
const frontendCommunicator = require("../common/frontend-communicator");
const rewardManager = require("../channel-rewards/channel-reward-manager");

const eventManager = require("./EventManager");

const isUSLocale = app.getLocale() === "en-US";
const timeFormat = isUSLocale ? "h:mm" : "H:mm";

const previousActivity = [];

export function handleTriggeredEvent(source, event, metadata, eventSettings = { forceAllow: false, canRetrigger: true }) {
    if (source == null || event == null || metadata == null) {
        return;
    }

    if (event.activityFeed == null ||
        event.activityFeed.getMessage == null) {
        return;
    }


    const activityId = uuid();

    previousActivity.unshift({
        id: activityId,
        eventId: event.id,
        sourceId: source.id,
        metadata: metadata
    });

    if (previousActivity.length > 500) {
        previousActivity.length = 500;
    }

    frontendCommunicator.send("event-activity", {
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
        timestamp: moment().format(timeFormat)
    });
}

eventManager.on("event-triggered", ({
    event,
    source,
    meta,
    isManual,
    isRetrigger
}) => {
    if (isManual || isRetrigger) {
        return;
    }
    handleTriggeredEvent(source, event, meta);
});

frontendCommunicator.on("retrigger-event", (activityId) => {
    const activity = previousActivity.find(a => a.id === activityId);
    if (activity == null) {
        return;
    }

    if (activity.eventId === "channel-reward-redemption") {
        // Manually triggered by streamer, must pass in userId and userDisplayName can be falsy
        const metadata = {userId: "", userDisplayName: "", ...activity.metadata };
        rewardManager.triggerChannelReward(activity.metadata.rewardId, metadata);
    }

    eventManager.triggerEvent(activity.sourceId, activity.eventId,
        activity.metadata, false, true, false);
});

frontendCommunicator.onAsync("get-all-activity-events", async () => previousActivity);

frontendCommunicator.onAsync("get-activity-feed-supported-events", async () => {
    return eventManager
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
        .filter(e => e != null);
});
