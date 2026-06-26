import { EventManager } from "../../../events/event-manager";

export function triggerWatchStreak(
    username: string,
    userId: string,
    userDisplayName: string,
    streakCount: number,
    channelPointsAwarded: number,
    streakMessage: string
): void {
    void EventManager.triggerEvent("twitch", "watch-streak", {
        username,
        userId,
        userDisplayName,
        streakCount,
        channelPointsAwarded,
        streakMessage
    });
}