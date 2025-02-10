import { pick } from "../../utils";
import eventManager from "../EventManager";
import {
    EventSubChannelPredictionBeginOutcome,
    EventSubChannelPredictionOutcome,
    EventSubChannelPredictionEndStatus
} from "@twurple/eventsub-base";

function mapOutcome(outcome: EventSubChannelPredictionOutcome) {
    const mapped = {
        ...pick(outcome, ["id", "title", "users", "channelPoints"]),
        topPredictors: outcome.topPredictors.map(p => pick(p, ["userId", "userName", "userDisplayName", "channelPointsUsed", "channelPointsWon"]))
    };
    return mapped;
}

export function triggerChannelPredictionBegin(
    title: string,
    outcomes: EventSubChannelPredictionBeginOutcome[],
    startDate: Date,
    lockDate: Date
) {
    eventManager.triggerEvent("twitch", "channel-prediction-begin", {
        title,
        outcomes: outcomes.map(o => pick(o, ["id", "title", "color"])),
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
        outcomes: outcomes.map(mapOutcome),
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
        outcomes: outcomes.map(mapOutcome),
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
        outcomes: outcomes.map(mapOutcome),
        winningOutcome: mapOutcome(winningOutcome),
        startDate,
        endDate,
        status
    });
}