import eventManager from "../EventManager";
import {
    EventSubChannelPredictionBeginOutcome,
    EventSubChannelPredictionOutcome,
    EventSubChannelPredictionEndStatus
} from "@twurple/eventsub-base";

export function triggerChannelPredictionBegin(
    title: string,
    outcomes: EventSubChannelPredictionBeginOutcome[],
    startDate: Date,
    lockDate: Date
) {
    eventManager.triggerEvent("twitch", "channel-prediction-begin", {
        title,
        outcomes,
        startDate,
        lockDate
    });
}

export function triggerChannelPredictionProgress(
    title: string,
    outcomes: EventSubChannelPredictionOutcome[],
    startDate: Date,
    lockDate: Date
) {
    eventManager.triggerEvent("twitch", "channel-prediction-progress", {
        title,
        outcomes,
        startDate,
        lockDate
    });
}

export function triggerChannelPredictionLock(
    title: string,
    outcomes: EventSubChannelPredictionOutcome[],
    startDate: Date,
    lockDate: Date
) {
    eventManager.triggerEvent("twitch", "channel-prediction-lock", {
        title,
        outcomes,
        startDate,
        lockDate
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
    eventManager.triggerEvent("twitch", "channel-prediction-end", {
        title,
        outcomes,
        winningOutcome,
        startDate,
        endDate,
        status
    });
}