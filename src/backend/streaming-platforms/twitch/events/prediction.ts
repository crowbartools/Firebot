import {
    EventSubChannelPredictionBeginOutcome,
    EventSubChannelPredictionOutcome,
    EventSubChannelPredictionEndStatus
} from "@twurple/eventsub-base";
import { EventManager } from "../../../events/event-manager";
import { pick } from "../../../utils";
import { InternalBus } from "../../../internal-bus";

function mapOutcome(outcome: EventSubChannelPredictionOutcome) {
    const mapped = {
        ...pick(outcome, ["id", "title", "users", "channelPoints"]),
        topPredictors: outcome.topPredictors.map(p => pick(p, ["userId", "userName", "userDisplayName", "channelPointsUsed", "channelPointsWon"]))
    };
    return mapped;
}

function toChannelOutcome(outcome: EventSubChannelPredictionOutcome) {
    return {
        id: outcome.id,
        title: outcome.title,
        channelPoints: outcome.channelPoints,
        users: outcome.users
    };
}

export function triggerChannelPredictionBegin(
    title: string,
    outcomes: EventSubChannelPredictionBeginOutcome[],
    startDate: Date,
    lockDate: Date
) {
    void EventManager.triggerEvent("twitch", "channel-prediction-begin", {
        title,
        outcomes: outcomes.map(o => pick(o, ["id", "title", "color"])),
        startDate,
        lockDate
    });

    InternalBus.emit("channel-prediction-begin", {
        title,
        startDate,
        lockDate,
        outcomes: outcomes.map(o => ({ id: o.id, title: o.title, color: o.color, channelPoints: 0, users: 0 })),
        winningOutcomeId: null,
        status: "active"
    });
}

export function triggerChannelPredictionProgress(
    title: string,
    outcomes: EventSubChannelPredictionOutcome[],
    startDate: Date,
    lockDate: Date
) {
    void EventManager.triggerEvent("twitch", "channel-prediction-progress", {
        title,
        outcomes: outcomes.map(mapOutcome),
        startDate,
        lockDate
    });

    InternalBus.emit("channel-prediction-progress", {
        title,
        startDate,
        lockDate,
        outcomes: outcomes.map(toChannelOutcome),
        winningOutcomeId: null,
        status: "active"
    });
}

export function triggerChannelPredictionLock(
    title: string,
    outcomes: EventSubChannelPredictionOutcome[],
    startDate: Date,
    lockDate: Date
) {
    void EventManager.triggerEvent("twitch", "channel-prediction-lock", {
        title,
        outcomes: outcomes.map(mapOutcome),
        startDate,
        lockDate
    });

    InternalBus.emit("channel-prediction-lock", {
        title,
        startDate,
        lockDate,
        outcomes: outcomes.map(toChannelOutcome),
        winningOutcomeId: null,
        status: "locked"
    });
}

export function triggerChannelPredictionEnd(
    title: string,
    outcomes: EventSubChannelPredictionOutcome[],
    winningOutcome: EventSubChannelPredictionOutcome,
    startDate: Date,
    endDate: Date,
    status: EventSubChannelPredictionEndStatus
) {
    void EventManager.triggerEvent("twitch", "channel-prediction-end", {
        title,
        outcomes: outcomes.map(mapOutcome),
        winningOutcome: mapOutcome(winningOutcome),
        startDate,
        endDate,
        status
    });

    InternalBus.emit("channel-prediction-end", {
        title,
        startDate,
        lockDate: endDate,
        outcomes: outcomes.map(toChannelOutcome),
        winningOutcomeId: winningOutcome?.id ?? null,
        status
    });
}