import { EventManager } from "../../../events/event-manager";

export function triggerTimeout(
    username: string,
    userId: string,
    userDisplayName: string,
    moderatorUsername: string,
    moderatorId: string,
    moderatorDisplayName: string,
    timeoutDuration: string | number,
    modReason: string
): void {
    void EventManager.triggerEvent("twitch", "timeout", {
        username,
        userId,
        userDisplayName,
        moderatorUsername,
        moderatorId,
        moderatorDisplayName,
        moderator: moderatorDisplayName,
        timeoutDuration,
        modReason
    });
}