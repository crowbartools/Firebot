import eventManager from "../EventManager";
import { EventSubChannelHypeTrainContribution } from "@twurple/eventsub-base";
import frontendCommunicator from "../../common/frontend-communicator";

function sendStartProgressEventToFrontend(
    eventType: "start" | "progress",
    level: number,
    goal: number,
    progress: number,
    endsAt: Date
) {
    frontendCommunicator.send(`hype-train:${eventType}`, {
        level,
        progressPercentage: Math.floor(progress / goal * 100),
        endsAt
    });
}

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

    sendStartProgressEventToFrontend("start", level, goal, progress, expiryDate);
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

    sendStartProgressEventToFrontend("progress", level, goal, progress, expiryDate);
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

    frontendCommunicator.send("hype-train:end");
}