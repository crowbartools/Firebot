import eventManager from "../EventManager";
import { EventSubChannelHypeTrainContribution } from "@twurple/eventsub-base"

export function triggerHypeTrainStart(
    total: number,
    progress: number,
    goal: number,
    level: number,
    startDate: Date,
    expiryDate: Date,
    lastContribution: EventSubChannelHypeTrainContribution,
    topContributors: EventSubChannelHypeTrainContribution[]
) {
    eventManager.triggerEvent("twitch", "hype-train-start", {
        total,
        progress,
        goal,
        level,
        startDate,
        expiryDate,
        lastContribution,
        topContributors
    });
}

export function triggerHypeTrainProgress(
    total: number,
    progress: number,
    goal: number,
    level: number,
    startDate: Date,
    expiryDate: Date,
    lastContribution: EventSubChannelHypeTrainContribution,
    topContributors: EventSubChannelHypeTrainContribution[]
) {
    eventManager.triggerEvent("twitch", "hype-train-progress", {
        total,
        progress,
        goal,
        level,
        startDate,
        expiryDate,
        lastContribution,
        topContributors
    });
}

export function triggerHypeTrainEnd(
    total: number,
    level: number,
    startDate: Date,
    endDate: Date,
    cooldownEndDate: Date,
    topContributors: EventSubChannelHypeTrainContribution[]
) {
    eventManager.triggerEvent("twitch", "hype-train-end", {
        total,
        level,
        startDate,
        endDate,
        cooldownEndDate,
        topContributors
    });
}