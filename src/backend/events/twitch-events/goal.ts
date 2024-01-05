import eventManager from "../EventManager";
import { EventSubChannelGoalType } from "@twurple/eventsub-base";

function getFriendlyTypeName(type: EventSubChannelGoalType): string {
    switch (type) {
        case "follow":
            return "Follower";

        case "new_subscription":
            return "New Sub Point";

        case "new_subscription_count":
            return "New Sub";

        case "subscription":
            return "Sub Point";

        case "subscription_count":
            return "Sub";

        default:
            return "Unknown";
    }
}

export function triggerChannelGoalBegin(
    description: string,
    type: EventSubChannelGoalType,
    startDate: Date,
    currentAmount: number,
    targetAmount: number
) {
    const friendlyTypeName = getFriendlyTypeName(type);

    eventManager.triggerEvent("twitch", "channel-goal-begin", {
        description,
        type,
        friendlyTypeName,
        startDate,
        currentAmount,
        targetAmount
    });
}

export function triggerChannelGoalProgress(
    description: string,
    type: EventSubChannelGoalType,
    startDate: Date,
    currentAmount: number,
    targetAmount: number
) {
    const friendlyTypeName = getFriendlyTypeName(type);

    eventManager.triggerEvent("twitch", "channel-goal-progress", {
        description,
        type,
        friendlyTypeName,
        startDate,
        currentAmount,
        targetAmount
    });
}

export function triggerChannelGoalEnd(
    description: string,
    type: EventSubChannelGoalType,
    startDate: Date,
    endDate: Date,
    currentAmount: number,
    targetAmount: number,
    isAchieved: boolean
) {
    const friendlyTypeName = getFriendlyTypeName(type);

    eventManager.triggerEvent("twitch", "channel-goal-end", {
        description,
        type,
        friendlyTypeName,
        startDate,
        endDate,
        currentAmount,
        targetAmount,
        isAchieved
    });
}