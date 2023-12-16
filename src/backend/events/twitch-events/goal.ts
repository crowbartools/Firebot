import eventManager from "../EventManager";
import { EventSubChannelGoalType } from "@twurple/eventsub-base";

export function triggerChannelGoalBegin(
    description: string,
    type: EventSubChannelGoalType,
    startDate: Date,
    currentAmount: number,
    targetAmount: number
) {
    eventManager.triggerEvent("twitch", "channel-goal-begin", {
        description,
        type,
        startDate,
        currentAmount,
        targetAmount
    });
};

export function triggerChannelGoalProgress(
    description: string,
    type: EventSubChannelGoalType,
    startDate: Date,
    currentAmount: number,
    targetAmount: number
) {
    eventManager.triggerEvent("twitch", "channel-goal-progress", {
        description,
        type,
        startDate,
        currentAmount,
        targetAmount
    });
};

export function triggerChannelGoalEnd(
    description: string,
    type: EventSubChannelGoalType,
    startDate: Date,
    endDate: Date,
    currentAmount: number,
    targetAmount: number,
    isAchieved: boolean
) {
    eventManager.triggerEvent("twitch", "channel-goal-end", {
        description,
        type,
        startDate,
        endDate,
        currentAmount,
        targetAmount,
        isAchieved
    });
};