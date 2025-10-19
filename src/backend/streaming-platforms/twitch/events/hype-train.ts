import { EventSubChannelHypeTrainContribution, EventSubChannelHypeTrainType } from "@twurple/eventsub-base";
import { EventManager } from "../../../events/event-manager";
import frontendCommunicator from "../../../common/frontend-communicator";

let hypeTrainLevel = 0;

function sendStartProgressEventToFrontend(
    eventType: "start" | "progress",
    level: number,
    goal: number,
    progress: number,
    endsAt: Date,
    isGoldenKappaTrain: boolean,
    isTreasureTrain: boolean,
    isSharedTrain: boolean
) {
    frontendCommunicator.send(`hype-train:${eventType}`, {
        level,
        progressPercentage: Math.floor(progress / goal * 100),
        endsAt,
        isGoldenKappaTrain,
        isTreasureTrain,
        isSharedTrain
    });
}

function mapContribution(contribution: EventSubChannelHypeTrainContribution) {
    return {
        userDisplayName: contribution.userDisplayName,
        userName: contribution.userName,
        userId: contribution.userId,
        type: contribution.type,
        total: contribution.total
    };
}

export function triggerHypeTrainStart(
    total: number,
    progress: number,
    goal: number,
    level: number,
    startDate: Date,
    expiryDate: Date,
    topContributors: EventSubChannelHypeTrainContribution[],
    hypeTrainType: EventSubChannelHypeTrainType,
    isSharedTrain: boolean
) {
    hypeTrainLevel = level;

    const isGoldenKappaTrain = hypeTrainType === "golden_kappa";
    const isTreasureTrain = hypeTrainType === "treasure";

    void EventManager.triggerEvent("twitch", "hype-train-start", {
        total,
        progress,
        goal,
        level,
        startDate,
        expiryDate,
        topContributors: topContributors.map(mapContribution),
        isGoldenKappaTrain,
        isTreasureTrain,
        isSharedTrain
    });

    sendStartProgressEventToFrontend("start", level, goal, progress, expiryDate, isGoldenKappaTrain, isTreasureTrain, isSharedTrain);
}

export function triggerHypeTrainProgress(
    total: number,
    progress: number,
    goal: number,
    level: number,
    startDate: Date,
    expiryDate: Date,
    topContributors: EventSubChannelHypeTrainContribution[],
    hypeTrainType: EventSubChannelHypeTrainType,
    isSharedTrain: boolean
) {
    const isGoldenKappaTrain = hypeTrainType === "golden_kappa";
    const isTreasureTrain = hypeTrainType === "treasure";

    void EventManager.triggerEvent("twitch", "hype-train-progress", {
        total,
        progress,
        goal,
        level,
        startDate,
        expiryDate,
        topContributors: topContributors.map(mapContribution),
        isGoldenKappaTrain,
        isTreasureTrain,
        isSharedTrain
    });

    const previousLevel = hypeTrainLevel;
    hypeTrainLevel = level;

    if (previousLevel !== level) {
        void EventManager.triggerEvent("twitch", "hype-train-level-up", {
            previousLevel,
            level
        });
    }

    sendStartProgressEventToFrontend("progress", level, goal, progress, expiryDate, isGoldenKappaTrain, isTreasureTrain, isSharedTrain);
}

export function triggerHypeTrainEnd(
    total: number,
    level: number,
    startDate: Date,
    endDate: Date,
    cooldownEndDate: Date,
    topContributors: EventSubChannelHypeTrainContribution[],
    hypeTrainType: EventSubChannelHypeTrainType,
    isSharedTrain: boolean
) {
    hypeTrainLevel = 0;

    const isGoldenKappaTrain = hypeTrainType === "golden_kappa";
    const isTreasureTrain = hypeTrainType === "treasure";

    void EventManager.triggerEvent("twitch", "hype-train-end", {
        total,
        level,
        startDate,
        endDate,
        cooldownEndDate,
        topContributors: topContributors.map(mapContribution),
        isGoldenKappaTrain,
        isTreasureTrain,
        isSharedTrain
    });

    frontendCommunicator.send("hype-train:end");
}